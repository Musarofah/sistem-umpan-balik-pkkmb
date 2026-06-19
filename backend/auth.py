"""
=============================================================
AUTH HELPER - Verifikasi token Supabase
=============================================================
"""

import os
from functools import wraps
from flask import request, jsonify
from supabase import create_client, Client

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY')

# Client untuk verifikasi token (pakai anon key cukup untuk get_user).
# Dibuat dengan aman: kalau .env belum diisi, jangan sampai import file
# ini membuat seluruh aplikasi Flask gagal start.
auth_client: Client | None = None
AUTH_CONFIGURED = bool(SUPABASE_URL and SUPABASE_ANON_KEY)

if AUTH_CONFIGURED:
    try:
        auth_client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    except Exception as e:
        print(f"[auth.py] Gagal membuat Supabase auth client: {e}")
        auth_client = None
        AUTH_CONFIGURED = False
else:
    print(
        "[auth.py] PERINGATAN: SUPABASE_URL / SUPABASE_ANON_KEY belum diisi di "
        ".env — login admin tidak akan berfungsi sampai diisi."
    )


def supabase_jwt_required(f):
    """Decorator: cek header Authorization: Bearer <supabase_access_token>"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if auth_client is None:
            return jsonify({
                'error': 'Supabase belum dikonfigurasi di server (lihat backend/.env).'
            }), 503

        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token tidak ditemukan'}), 401

        token = auth_header.split(' ', 1)[1]

        try:
            user_resp = auth_client.auth.get_user(token)
            user = user_resp.user
            if not user:
                return jsonify({'error': 'Token tidak valid'}), 401
        except Exception:
            return jsonify({'error': 'Token tidak valid atau kadaluarsa'}), 401

        # simpan info user untuk dipakai di view function jika perlu
        request.current_user = {
            'id': user.id,
            'email': user.email,
        }
        return f(*args, **kwargs)

    return decorated
