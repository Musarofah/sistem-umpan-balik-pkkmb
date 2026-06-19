"""
=============================================================
BACKEND API (Flask) - dengan Supabase Auth & Database
Klasifikasi Sentimen Umpan Balik Mahasiswa PKKMB
=============================================================
"""

import os
import sys
import json
import pandas as pd
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

load_dotenv()

import models
from auth import supabase_jwt_required, auth_client, AUTH_CONFIGURED

# Tambahkan path model
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, 'model'))

from predict import SentimenPredictor

# Frontend hasil build Vite ada di frontend/dist (bukan frontend/templates
# atau frontend/static — folder itu tidak pernah dibuat oleh `npm run build`).
FRONTEND_DIST = os.path.join(BASE_DIR, 'frontend', 'dist')

app = Flask(
    __name__,
    static_folder=FRONTEND_DIST,
    static_url_path='/',
)
CORS(app)

MODEL_DIR = os.path.join(BASE_DIR, 'model', 'saved_model')
predictor = None
predictor_error = None


def get_predictor():
    global predictor, predictor_error
    if predictor is None and predictor_error is None:
        try:
            predictor = SentimenPredictor(MODEL_DIR)
        except Exception as e:
            predictor_error = str(e)
            raise
    if predictor is None:
        raise RuntimeError(predictor_error or 'Model belum siap')
    return predictor


# ─── Halaman Utama (React SPA) ───────────────────────────────
@app.route('/')
def index():
    return send_from_directory(FRONTEND_DIST, 'index.html')


# Catch-all supaya route React Router (mis. /admin, /upload, /dashboard)
# tetap mengembalikan index.html saat direfresh / diakses langsung,
# bukan 404 dari Flask. Route /api/* tidak disentuh route ini.
@app.route('/<path:path>')
def spa_catch_all(path):
    if path.startswith('api/'):
        return jsonify({'error': 'Endpoint tidak ditemukan'}), 404
    full_path = os.path.join(FRONTEND_DIST, path)
    if os.path.isfile(full_path):
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, 'index.html')


# ─── AUTH: Login (via Supabase Auth) ─────────────────────────
@app.route('/api/auth/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    Body: { "username": "admin@pkkmb.local", "password": "..." }
    Catatan: "username" diisi dengan email yang terdaftar di Supabase Auth
    (Authentication > Users di dashboard Supabase).
    """
    if not AUTH_CONFIGURED:
        return jsonify({
            'error': 'Supabase belum dikonfigurasi di server. Isi SUPABASE_URL, '
                     'SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_KEY pada backend/.env.'
        }), 503

    data = request.get_json() or {}
    email = data.get('username', '').strip() or data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email/username dan password diperlukan'}), 400

    try:
        result = auth_client.auth.sign_in_with_password({
            'email': email,
            'password': password,
        })
    except Exception:
        return jsonify({'error': 'Email atau password salah'}), 401

    if not result.session:
        return jsonify({'error': 'Email atau password salah'}), 401

    return jsonify({
        'status': 'success',
        'access_token': result.session.access_token,
        'refresh_token': result.session.refresh_token,
        'user': {
            'id': result.user.id,
            'email': result.user.email,
        },
    })


# ─── AUTH: Get current user ──────────────────────────────────
@app.route('/api/auth/me', methods=['GET'])
@supabase_jwt_required
def me():
    return jsonify({'status': 'success', 'user': request.current_user})


# ─── API: Prediksi Satu Teks (disimpan ke riwayat) ───────────
@app.route('/api/predict', methods=['POST'])
def api_predict():
    """
    POST /api/predict
    Body: { "teks": "..." }
    """
    data = request.get_json()
    if not data or 'teks' not in data:
        return jsonify({'error': 'Field "teks" diperlukan'}), 400

    teks = str(data['teks']).strip()
    if not teks:
        return jsonify({'error': 'Teks tidak boleh kosong'}), 400

    try:
        hasil = get_predictor().predict(teks)
    except Exception as e:
        return jsonify({'error': f'Model gagal memproses teks: {e}'}), 500

    # Simpan ke riwayat tidak boleh menggagalkan respons prediksi.
    # Kalau Supabase belum dikonfigurasi / tabel belum ada, prediksi
    # tetap dikembalikan ke pengguna, hanya riwayatnya tidak tersimpan.
    try:
        row = models.hasil_to_row(hasil, sumber='manual')
        models.insert_history(row)
    except Exception as e:
        print(f"[api_predict] Gagal menyimpan riwayat: {e}")

    return jsonify({'status': 'success', 'data': hasil})


# ─── API: Prediksi Batch ─────────────────────────────────────
@app.route('/api/predict/batch', methods=['POST'])
def api_predict_batch():
    """
    POST /api/predict/batch
    Body: { "texts": ["teks1", "teks2", ...] }
    """
    data = request.get_json()
    if not data or 'texts' not in data:
        return jsonify({'error': 'Field "texts" diperlukan'}), 400

    texts = data['texts']
    if not isinstance(texts, list) or len(texts) == 0:
        return jsonify({'error': '"texts" harus berupa list yang tidak kosong'}), 400

    if len(texts) > 500:
        return jsonify({'error': 'Maksimal 500 teks per permintaan'}), 400

    try:
        pred  = get_predictor()
        hasil = pred.predict_batch(texts)

        labels = [h['label'] for h in hasil]
        stats = {
            'total'  : len(labels),
            'positif': labels.count('positif'),
            'netral' : labels.count('netral'),
            'negatif': labels.count('negatif'),
        }
        stats['pct_positif'] = round(stats['positif'] / stats['total'] * 100, 1)
        stats['pct_netral']  = round(stats['netral']  / stats['total'] * 100, 1)
        stats['pct_negatif'] = round(stats['negatif'] / stats['total'] * 100, 1)

        return jsonify({'status': 'success', 'statistik': stats, 'data': hasil})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── API: Upload CSV (disimpan ke riwayat) ───────────────────
@app.route('/api/upload', methods=['POST'])
def api_upload():
    """Upload file CSV untuk prediksi massal."""
    if 'file' not in request.files:
        return jsonify({'error': 'File tidak ditemukan'}), 400

    file = request.files['file']
    if file.filename == '' or not file.filename.endswith('.csv'):
        return jsonify({'error': 'Harap unggah file CSV'}), 400

    try:
        df = None
        for sep in [';', ',', '\t']:
            try:
                df = pd.read_csv(file, sep=sep, encoding='utf-8')
                file.seek(0)
                if len(df.columns) > 1:
                    break
            except Exception:
                file.seek(0)

        kolom_teks = None
        kandidat = ['Q16_KRITIK DAN SARAN', 'teks', 'text', 'komentar',
                     'kritik', 'saran', 'feedback', 'umpan balik']
        for k in kandidat:
            if k in df.columns:
                kolom_teks = k
                break
        if kolom_teks is None:
            kolom_teks = df.columns[0]

        texts = df[kolom_teks].dropna().astype(str).tolist()
        if len(texts) == 0:
            return jsonify({'error': 'Tidak ada data teks yang valid'}), 400

        texts = texts[:1000]

        pred   = get_predictor()
        hasil  = pred.predict_batch(texts)
        labels = [h['label'] for h in hasil]

        # Simpan semua ke riwayat (bulk insert). Jangan sampai gagal
        # menyimpan riwayat menggagalkan hasil prediksi yang sudah ada.
        try:
            rows = [models.hasil_to_row(h, sumber='upload') for h in hasil]
            models.insert_history_bulk(rows)
        except Exception as e:
            print(f"[api_upload] Gagal menyimpan riwayat: {e}")

        stats = {
            'total'      : len(labels),
            'positif'    : labels.count('positif'),
            'netral'     : labels.count('netral'),
            'negatif'    : labels.count('negatif'),
            'pct_positif': round(labels.count('positif') / len(labels) * 100, 1),
            'pct_netral' : round(labels.count('netral')  / len(labels) * 100, 1),
            'pct_negatif': round(labels.count('negatif') / len(labels) * 100, 1),
        }

        return jsonify({
            'status'    : 'success',
            'statistik' : stats,
            'sampel'    : hasil[:50],
            'total_data': len(texts),
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ─── ADMIN: Riwayat Prediksi (CRUD) ──────────────────────────
@app.route('/api/admin/history', methods=['GET'])
@supabase_jwt_required
def admin_get_history():
    """
    GET /api/admin/history?page=1&per_page=20&label=positif&search=kata&sumber=manual
    """
    page     = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 20, type=int), 100)
    label    = request.args.get('label')
    sumber   = request.args.get('sumber')
    search   = request.args.get('search', '').strip()

    try:
        result = models.get_history(page=page, per_page=per_page, label=label, sumber=sumber, search=search)
    except models.SupabaseNotConfigured as e:
        return jsonify({'error': str(e)}), 503

    return jsonify({
        'status': 'success',
        'data': result['data'],
        'pagination': result['pagination'],
    })


@app.route('/api/admin/history/<int:item_id>', methods=['GET'])
@supabase_jwt_required
def admin_get_history_item(item_id):
    item = models.get_history_item(item_id)
    if not item:
        return jsonify({'error': 'Data tidak ditemukan'}), 404
    return jsonify({'status': 'success', 'data': item})


@app.route('/api/admin/history', methods=['POST'])
@supabase_jwt_required
def admin_create_history():
    """
    Tambah entri riwayat secara manual (mis. data lama yang ingin diarsipkan).
    Body: { "teks_asli": "...", "label": "positif" }
    """
    data = request.get_json() or {}
    teks_asli = str(data.get('teks_asli', '')).strip()
    label     = data.get('label', '').strip().lower()

    if not teks_asli:
        return jsonify({'error': 'Field "teks_asli" diperlukan'}), 400
    if label not in ['positif', 'netral', 'negatif']:
        return jsonify({'error': 'Field "label" harus salah satu: positif, netral, negatif'}), 400

    row = {
        'teks_asli': teks_asli,
        'teks_bersih': data.get('teks_bersih', teks_asli),
        'label': label,
        'confidence': data.get('confidence', 1.0),
        'prob_positif': data.get('prob_positif', 0),
        'prob_netral': data.get('prob_netral', 0),
        'prob_negatif': data.get('prob_negatif', 0),
        'sumber': 'manual',
    }
    item = models.insert_history(row)
    return jsonify({'status': 'success', 'data': item}), 201


@app.route('/api/admin/history/<int:item_id>', methods=['PUT'])
@supabase_jwt_required
def admin_update_history(item_id):
    """
    Update / koreksi label sebuah entri riwayat.
    Body: { "label_koreksi": "negatif", "teks_asli": "..." (opsional) }
    """
    item = models.get_history_item(item_id)
    if not item:
        return jsonify({'error': 'Data tidak ditemukan'}), 404

    data = request.get_json() or {}
    updates = {}

    if 'label_koreksi' in data:
        label_koreksi = data['label_koreksi']
        if label_koreksi not in [None, '', 'positif', 'netral', 'negatif']:
            return jsonify({'error': 'label_koreksi tidak valid'}), 400
        updates['label_koreksi'] = label_koreksi or None

    if 'teks_asli' in data and str(data['teks_asli']).strip():
        updates['teks_asli'] = str(data['teks_asli']).strip()

    if not updates:
        return jsonify({'status': 'success', 'data': item})

    updated = models.update_history_item(item_id, updates)
    return jsonify({'status': 'success', 'data': updated})


@app.route('/api/admin/history/<int:item_id>', methods=['DELETE'])
@supabase_jwt_required
def admin_delete_history(item_id):
    item = models.get_history_item(item_id)
    if not item:
        return jsonify({'error': 'Data tidak ditemukan'}), 404

    models.delete_history_item(item_id)
    return jsonify({'status': 'success', 'message': 'Data berhasil dihapus'})


@app.route('/api/admin/history/bulk-delete', methods=['POST'])
@supabase_jwt_required
def admin_bulk_delete_history():
    """
    Body: { "ids": [1, 2, 3] }
    """
    data = request.get_json() or {}
    ids = data.get('ids', [])
    if not isinstance(ids, list) or not ids:
        return jsonify({'error': 'Field "ids" harus berupa list yang tidak kosong'}), 400

    deleted = models.bulk_delete_history(ids)
    return jsonify({'status': 'success', 'deleted': deleted})


@app.route('/api/admin/history/summary', methods=['GET'])
@supabase_jwt_required
def admin_history_summary():
    """Ringkasan statistik riwayat untuk admin dashboard."""
    try:
        summary = models.history_summary()
    except models.SupabaseNotConfigured as e:
        return jsonify({'error': str(e)}), 503
    return jsonify({'status': 'success', 'data': summary})


# ─── API: Statistik Model (hasil training) ───────────────────
@app.route('/api/stats', methods=['GET'])
def api_stats():
    result_path = os.path.join(BASE_DIR, 'model', 'results', 'results.json')
    if not os.path.exists(result_path):
        return jsonify({'error': 'Hasil training belum tersedia'}), 404

    with open(result_path) as f:
        results = json.load(f)

    return jsonify({'status': 'success', 'data': results})


# ─── API: Health Check ───────────────────────────────────────
@app.route('/api/health', methods=['GET'])
def health():
    model_ready = os.path.exists(os.path.join(MODEL_DIR, 'config.json'))
    return jsonify({
        'status'             : 'ok',
        'model_ready'        : model_ready,
        'model_path'         : MODEL_DIR,
        'supabase_configured': models.SUPABASE_CONFIGURED,
        'auth_configured'    : AUTH_CONFIGURED,
    })


if __name__ == '__main__':
    print("=" * 60)
    print("SISTEM KLASIFIKASI SENTIMEN PKKMB - IndoBERT")
    print("=" * 60)
    print("Buka browser: http://localhost:5000")
    print("Database & Auth: Supabase")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5000)
