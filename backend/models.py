"""
=============================================================
SUPABASE CLIENT & HELPER
Sistem Evaluasi PKKMB - Riwayat Prediksi (via Supabase)
=============================================================
"""

import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')

TABLE = 'prediction_history'

# Service client -> bypass RLS, dipakai backend untuk semua operasi tabel.
# Dibuat secara "lazy" & aman: kalau .env belum diisi, jangan sampai
# seluruh aplikasi gagal start hanya karena Supabase belum dikonfigurasi.
# Fitur prediksi tetap bisa jalan, hanya penyimpanan riwayat yang dilewati.
supabase: Client | None = None
SUPABASE_CONFIGURED = bool(SUPABASE_URL and SUPABASE_SERVICE_KEY)

if SUPABASE_CONFIGURED:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    except Exception as e:
        print(f"[models.py] Gagal membuat Supabase client: {e}")
        supabase = None
        SUPABASE_CONFIGURED = False
else:
    print(
        "[models.py] PERINGATAN: SUPABASE_URL / SUPABASE_SERVICE_KEY belum diisi di "
        ".env — riwayat prediksi tidak akan disimpan sampai diisi."
    )


class SupabaseNotConfigured(Exception):
    pass


def _require_client():
    if supabase is None:
        raise SupabaseNotConfigured(
            'Supabase belum dikonfigurasi. Isi SUPABASE_URL dan '
            'SUPABASE_SERVICE_KEY pada file backend/.env.'
        )
    return supabase


# ─── Helper: format hasil prediksi -> row untuk Supabase ─────
def hasil_to_row(hasil, sumber='manual'):
    return {
        'teks_asli': hasil['teks_asli'],
        'teks_bersih': hasil['teks_bersih'],
        'label': hasil['label'],
        'confidence': hasil['confidence'],
        'prob_positif': hasil['probabilitas']['positif'],
        'prob_netral': hasil['probabilitas']['netral'],
        'prob_negatif': hasil['probabilitas']['negatif'],
        'sumber': sumber,
    }


def insert_history(row):
    """Simpan satu baris riwayat. Kalau Supabase belum dikonfigurasi,
    diam-diam dilewati supaya endpoint prediksi tetap berhasil."""
    if supabase is None:
        return None
    res = supabase.table(TABLE).insert(row).execute()
    return res.data[0] if res.data else None


def insert_history_bulk(rows):
    if supabase is None:
        return []
    res = supabase.table(TABLE).insert(rows).execute()
    return res.data


def get_history(page=1, per_page=20, label=None, sumber=None, search=None):
    client = _require_client()
    query = client.table(TABLE).select('*', count='exact')

    if label and label in ['positif', 'netral', 'negatif']:
        query = query.eq('label', label)
    if sumber and sumber in ['manual', 'upload']:
        query = query.eq('sumber', sumber)
    if search:
        query = query.ilike('teks_asli', f'%{search}%')

    start = (page - 1) * per_page
    end = start + per_page - 1

    query = query.order('created_at', desc=True).range(start, end)
    res = query.execute()

    total = res.count or 0
    pages = (total + per_page - 1) // per_page if per_page else 0

    return {
        'data': res.data,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': total,
            'pages': pages,
        }
    }


def get_history_item(item_id):
    client = _require_client()
    res = client.table(TABLE).select('*').eq('id', item_id).execute()
    return res.data[0] if res.data else None


def update_history_item(item_id, updates):
    client = _require_client()
    res = client.table(TABLE).update(updates).eq('id', item_id).execute()
    return res.data[0] if res.data else None


def delete_history_item(item_id):
    client = _require_client()
    res = client.table(TABLE).delete().eq('id', item_id).execute()
    return len(res.data) > 0


def bulk_delete_history(ids):
    client = _require_client()
    res = client.table(TABLE).delete().in_('id', ids).execute()
    return len(res.data)


def history_summary():
    client = _require_client()

    def count(filters=None):
        q = client.table(TABLE).select('id', count='exact')
        if filters:
            for col, val in filters.items():
                q = q.eq(col, val)
        return q.execute().count or 0

    total    = count()
    positif  = count({'label': 'positif'})
    netral   = count({'label': 'netral'})
    negatif  = count({'label': 'negatif'})
    manual   = count({'sumber': 'manual'})
    upload   = count({'sumber': 'upload'})

    # dikoreksi: label_koreksi is not null
    res = client.table(TABLE).select('id', count='exact').not_.is_('label_koreksi', 'null').execute()
    dikoreksi = res.count or 0

    return {
        'total': total,
        'positif': positif,
        'netral': netral,
        'negatif': negatif,
        'sumber_manual': manual,
        'sumber_upload': upload,
        'dikoreksi': dikoreksi,
    }
