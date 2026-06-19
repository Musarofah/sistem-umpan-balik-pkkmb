# PKKMB — Sistem Klasifikasi Sentimen (IndoBERT + Supabase)

Website analisis sentimen umpan balik mahasiswa PKKMB, memakai model
IndoBERT hasil fine-tuning sendiri (`PKKMB_IndoBERT_FINAL.ipynb`) sebagai
otak prediksi, dan **Supabase** sebagai database riwayat prediksi + sistem
login admin.

```
pkkmb-fullstack/
├── backend/      Flask API (auth, predict, upload, admin CRUD) → port 5000
├── model/        Model IndoBERT (saved_model/) + kode prediksi (predict.py)
├── frontend/     React + Vite + Tailwind (sudah di-build ke frontend/dist)
└── supabase_schema.sql   SQL untuk membuat tabel di Supabase
```

Frontend (React) **tidak** bicara langsung ke Supabase. Semua request dari
browser masuk ke Flask dulu (`/api/...`), dan Flask-lah yang bicara ke
Supabase memakai service role key. Jadi API key Supabase Anda **tidak akan
pernah terlihat oleh pengunjung website**.

---

## 1. Setup Supabase (5 menit)

1. Buat project baru di https://supabase.com (gratis).
2. Buka **SQL Editor** → New query → tempel seluruh isi file
   `supabase_schema.sql` di root project ini → klik **Run**.
   Ini akan membuat tabel `prediction_history` dengan kolom-kolom yang
   dipakai backend (lihat tabel kolom di bawah).
3. Buka **Authentication → Users → Add user**, buat 1 akun admin, misal:
   - Email: `admin@pkkmb.local`
   - Password: buat sendiri yang kuat

   Akun inilah yang dipakai untuk login di halaman `/admin/login` website
   (login pakai **email Supabase**, bukan `admin/admin123`).
4. Buka **Project Settings → API**, salin 3 nilai ini:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY` (klik "Reveal" dulu)

## 2. Isi kredensial di backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`, isi 3 baris dengan nilai dari langkah 1 di atas:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
```

`.env` sudah dimasukkan ke `.gitignore`, jadi tidak akan ikut ter-commit ke
git / ter-upload ulang secara tidak sengaja.

## 3. Jalankan backend

```bash
cd backend
pip install -r requirements.txt --break-system-packages
python app.py
```

Buka **http://localhost:5000** — backend ini sekaligus menyajikan
frontend (file di `frontend/dist`) DAN seluruh endpoint `/api/...`, jadi
cukup 1 server saja untuk produksi/demo.

Cek kesehatan sistem (model siap? Supabase konek?):
```
GET http://localhost:5000/api/health
```

> **Mode development frontend (opsional):** kalau ingin mengubah tampilan
> React dan melihat perubahan langsung tanpa build ulang, jalankan
> `npm run dev` di folder `frontend` (port 5173, sudah ada proxy `/api` ke
> port 5000). Setelah selesai mengedit, jalankan `npm run build` supaya
> `frontend/dist` ter-update, lalu backend otomatis menyajikan versi baru.

---

## Kolom tabel `prediction_history` di Supabase

Ini yang dibuat otomatis oleh `supabase_schema.sql` — sudah disesuaikan
persis dengan apa yang dikirim/dibaca oleh `backend/models.py`:

| Kolom          | Tipe data                     | Keterangan                                                        |
|----------------|--------------------------------|---------------------------------------------------------------------|
| `id`           | `bigint` (identity, PK)        | Otomatis bertambah                                                  |
| `teks_asli`    | `text`                          | Teks umpan balik asli dari mahasiswa                                |
| `teks_bersih`  | `text`                          | Teks setelah dibersihkan/dinormalisasi (yang dilihat model)         |
| `label`        | `text`                          | `positif` / `netral` / `negatif` (hasil prediksi model)              |
| `label_koreksi`| `text`, nullable                | Diisi admin kalau ingin mengoreksi label hasil model                 |
| `confidence`   | `numeric`                       | Tingkat keyakinan model (0–1) untuk label terpilih                   |
| `prob_positif` | `numeric`                       | Probabilitas kelas positif                                           |
| `prob_netral`  | `numeric`                       | Probabilitas kelas netral                                            |
| `prob_negatif` | `numeric`                       | Probabilitas kelas negatif                                           |
| `sumber`       | `text`                          | `manual` (dari halaman Analisis) / `upload` (dari halaman Upload CSV)|
| `created_at`   | `timestamptz`                  | Waktu prediksi disimpan, default `now()`                            |

RLS (Row Level Security) diaktifkan tapi tanpa policy publik — hanya
backend yang bisa baca/tulis (pakai service role key, yang otomatis
melewati RLS). Browser/frontend tidak pernah mengakses tabel ini langsung.

Login admin **tidak** memakai tabel buatan sendiri — Supabase Auth sudah
menyediakan tabel user terpisah (`auth.users`), jadi tidak perlu membuat
tabel users manual.

---

## Apa saja yang sudah diperbaiki dari versi sebelumnya

1. **Model production sekarang memakai file dari `saved_model.zip`** (model
   final hasil notebook), bukan model lama yang ikut dalam paket fullstack.
2. **Preprocessing teks di `model/predict.py` diperbaiki** agar identik
   dengan preprocessing saat training di notebook (cleaning regex +
   normalisasi kamus slang `KAMUS_NORMALISASI`). Sebelumnya predict.py
   hanya melakukan `lower()` + strip spasi, sehingga prediksi di website
   bisa melenceng dari hasil yang didapat saat training/evaluasi.
3. **Bug fatal di `backend/app.py`**: Flask dikonfigurasi membaca frontend
   dari folder `frontend/templates` & `frontend/static`, padahal hasil
   build Vite ada di `frontend/dist` — folder lama itu tidak pernah ada,
   jadi halaman web tidak akan pernah tampil. Sudah diperbaiki untuk
   menyajikan langsung dari `frontend/dist`, plus ditambahkan *catch-all*
   route supaya halaman seperti `/admin`, `/upload`, `/dashboard` tidak
   404 saat di-refresh langsung di browser (karena pakai React Router).
4. **Backend tidak lagi crash total kalau `.env` belum diisi.** Sebelumnya
   import `models.py`/`auth.py` langsung gagal kalau Supabase belum
   dikonfigurasi, sehingga seluruh server (termasuk fitur prediksi yang
   tidak butuh Supabase) ikut mati. Sekarang fitur prediksi tetap jalan;
   hanya fitur yang benar-benar butuh Supabase (riwayat & login admin)
   yang akan memberi pesan error jelas kalau `.env` belum diisi.
5. **`backend/.env` berisi kredensial Supabase asli** ikut ter-upload di
   paket lama — sudah diganti jadi `.env.example` (placeholder) dan
   ditambahkan ke `.gitignore`. **Disarankan rotasi (ganti) API key
   project Supabase yang lama itu**, karena sudah pernah terekspos.
6. **`backend/requirements.txt` lama berisi baris `pip uninstall ...` /
   `pip install ...`** yang bukan format requirements.txt yang valid, plus
   dependency yang sudah tidak dipakai (`flask-sqlalchemy`,
   `flask-jwt-extended`, dll, sisa dari versi sebelum pindah ke Supabase).
   Sudah dibersihkan.
7. **`/api/stats` (untuk halaman Dashboard) tidak punya data** karena
   notebook hanya men-download gambar grafik, bukan file JSON metrik.
   Sudah dibuatkan `model/results/results.json` berisi metrik evaluasi
   asli dari hasil run notebook (akurasi test 95.24%, classification
   report per kelas, & riwayat loss/akurasi per epoch).
8. Teks hint di halaman Login yang menyebut `admin/admin123` (tidak
   pernah benar-benar berfungsi karena login sebenarnya lewat Supabase
   Auth) sudah diperbaiki jadi instruksi yang sesuai.

---

## Halaman Frontend

| Route          | Akses    | Keterangan                              |
|----------------|----------|------------------------------------------|
| `/`            | Publik   | Landing page                             |
| `/analisis`    | Publik   | Input teks → klasifikasi sentimen        |
| `/dashboard`   | Publik   | Grafik evaluasi model (dari results.json)|
| `/upload`      | Publik   | Upload CSV untuk analisis massal         |
| `/admin/login` | Publik   | Login admin (Supabase Auth)              |
| `/admin`       | Privat   | Kelola riwayat prediksi (CRUD)           |
