# Sistem Evaluasi PKKMB - Frontend (React)

Frontend React + Vite + Tailwind untuk Sistem Klasifikasi Sentimen Umpan Balik
Mahasiswa terhadap Kegiatan PKKMB menggunakan IndoBERT.

## Struktur Halaman

- **/** — Beranda (landing page, fitur, cara kerja)
- **/analisis** — Input teks tunggal untuk diklasifikasikan
- **/dashboard** — Visualisasi hasil evaluasi model (akurasi, confusion matrix, dll)
- **/upload** — Upload file CSV untuk analisis massal

## Cara Menjalankan

### 1. Install dependencies
```bash
npm install
```

### 2. Jalankan backend Flask terlebih dahulu
Pastikan backend (dari project sebelumnya) berjalan di `http://localhost:5000`:
```bash
python backend/app.py
```

### 3. Jalankan frontend
```bash
npm run dev
```

Buka browser: `http://localhost:5173`

> Vite sudah dikonfigurasi untuk proxy semua request `/api/*` ke `http://localhost:5000`
> (lihat `vite.config.js`), jadi tidak perlu setting CORS tambahan saat development.

## Endpoint API yang Digunakan

| Endpoint              | Method | Keterangan                          |
|-----------------------|--------|--------------------------------------|
| `/api/predict`        | POST   | Prediksi sentimen 1 teks             |
| `/api/predict/batch`  | POST   | Prediksi sentimen banyak teks        |
| `/api/upload`         | POST   | Upload CSV untuk analisis massal     |
| `/api/stats`          | GET    | Hasil training/evaluasi model        |
| `/api/health`         | GET    | Cek status backend & model           |

## Build untuk Produksi

```bash
npm run build
```

Hasil build ada di folder `dist/`. Untuk deploy (misal ke Vercel), atur environment
variable agar request `/api` mengarah ke URL backend Flask Anda yang sudah online
(bisa pakai layanan seperti Railway, Render, atau Hugging Face Spaces untuk hosting
model IndoBERT-nya).
