# AI CV Screening

Aplikasi untuk membantu proses screening CV menggunakan AI. Aplikasi terdiri dari backend Django REST API dan frontend React dengan Vite.

## Fitur

- Membuat dan mengelola sesi rekrutmen.
- Mengunggah beberapa CV dalam format PDF.
- Mengubah CV PDF menjadi Markdown.
- Mengekstrak nama, email, nomor telepon, domisili, pendidikan, pengalaman, dan keahlian kandidat.
- Mengunggah PDF lowongan kerja untuk mengekstrak kualifikasi dan tanggung jawab secara otomatis.
- Mengatur kriteria penilaian dengan bobot 1 sampai 10.
- Membandingkan seluruh kandidat melalui tiga tabel analisis AI.
- Menyimpan data sesi, CV, hasil ekstraksi, dan hasil analisis di folder `backend/media/`.

## Teknologi yang Digunakan

### Backend

- Python
- Django
- Django REST Framework
- SQLite
- django-cors-headers
- Requests
- PyMuPDF4LLM untuk konversi PDF ke Markdown
- pypdf untuk membaca PDF
- python-dotenv untuk membaca konfigurasi `.env`
- json-repair untuk membantu memperbaiki JSON dari respons AI
- OpenRouter API dengan model Qwen

### Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide React
- Oxlint

## Persiapan Sistem

Pastikan perangkat sudah memiliki:

- Python 3.10 atau lebih baru
- Node.js 20.19 atau lebih baru
- npm
- Git, jika proyek diambil dari repository
- OpenRouter API Key untuk fitur AI

## Struktur Folder Utama

```text
ai-cv-screening/
├── backend/
│   ├── manage.py
│   ├── core/
│   ├── screening/
│   ├── media/
│   └── db.sqlite3
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
└── README.md
```

## Instalasi Backend

Buka terminal pada folder proyek, lalu masuk ke folder backend:

```powershell
cd backend
```

Buat virtual environment:

```powershell
python -m venv .venv
```

Aktifkan virtual environment pada Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Jika PowerShell menolak eksekusi script, jalankan perintah berikut sekali pada terminal PowerShell sebagai user saat ini:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Install paket backend:

```powershell
python -m pip install --upgrade pip
pip install django djangorestframework django-cors-headers requests pymupdf4llm pypdf python-dotenv json-repair google-generativeai
```

Jalankan migrasi database:

```powershell
python manage.py migrate
```

Opsional, buat akun admin Django:

```powershell
python manage.py createsuperuser
```

## Konfigurasi API Key

Buat file `.env` di dalam folder `backend/`:

```env
MY_API_KEY=isi_dengan_openrouter_api_key
MODEL_NAME=qwen/qwen3.8-max
```

API key juga dapat diisi dari halaman **Token & Pengaturan** pada aplikasi. Jangan commit file `.env` atau membagikan API key ke repository publik.

## Instalasi Frontend

Buka terminal baru, lalu masuk ke folder frontend:

```powershell
cd frontend
npm install
```

## Menjalankan Aplikasi

Jalankan backend terlebih dahulu pada terminal pertama:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver
```

Backend berjalan pada:

```text
http://127.0.0.1:8000
```

Kemudian jalankan frontend pada terminal kedua:

```powershell
cd frontend
npm run dev
```

Frontend biasanya tersedia pada:

```text
http://localhost:5173
```

Buka URL frontend tersebut di browser.

## Perintah Frontend Lainnya

```powershell
npm run build   # Membuat build production
npm run lint    # Menjalankan pemeriksaan lint
npm run preview # Meninjau hasil build production
```

## Alur Penggunaan

1. Buka frontend pada browser.
2. Buat sesi rekrutmen baru dan isi judul pekerjaan.
3. Buka sesi yang dibuat.
4. Masukkan API key pada tab **Token & Pengaturan**, lalu tes koneksi AI.
5. Unggah CV pelamar melalui tab **Manajemen CV**.
6. Pada tab **Hasil Analisa AI**, unggah PDF lowongan kerja atau tambahkan kriteria secara manual.
7. Atur bobot setiap kriteria jika diperlukan.
8. Jalankan analisis AI tiga tabel.
9. Tinjau hasil peringkat, skor, status seleksi, dan catatan kandidat.

## Penyimpanan Data

Data lokal disimpan pada folder berikut:

```text
backend/db.sqlite3
backend/media/sessions/
```

Setiap sesi menyimpan beberapa file, antara lain:

- `job_desc.md`: deskripsi pekerjaan.
- `criteria.json`: daftar kriteria dan bobot.
- `result.json`: kandidat dan hasil analisis.
- `raw_cv/`: file CV PDF.
- `parsed_cv/`: hasil konversi CV ke Markdown.

Folder `backend/media/` berisi data kandidat. Perlakukan folder tersebut sebagai data sensitif dan jangan mengunggahnya ke repository publik.

## Endpoint API Utama

Semua endpoint API menggunakan prefix `http://127.0.0.1:8000/api/`.

| Method           | Endpoint                          | Kegunaan                               |
| ---------------- | --------------------------------- | -------------------------------------- |
| GET, POST        | `/sessions/`                      | Melihat atau membuat sesi              |
| GET, PUT, DELETE | `/sessions/<id>/`                 | Melihat, mengubah, atau menghapus sesi |
| GET, POST        | `/sessions/<id>/criteria/`        | Membaca atau menyimpan kriteria        |
| POST             | `/sessions/<id>/criteria/upload/` | Mengunggah PDF lowongan kerja          |
| POST, DELETE     | `/sessions/<id>/upload/`          | Mengunggah atau menghapus CV           |
| POST             | `/sessions/<id>/retry/`           | Memproses ulang satu CV                |
| POST             | `/sessions/<id>/analyze/`         | Menjalankan analisis komparatif AI     |
| POST             | `/check-ai/`                      | Menguji koneksi OpenRouter             |

## Catatan Troubleshooting

- Jika frontend tidak dapat mengambil data, pastikan backend sedang berjalan pada port 8000.
- Jika muncul error API key, isi `MY_API_KEY` di `backend/.env` atau gunakan halaman pengaturan frontend.
- Jika modul Python tidak ditemukan, pastikan virtual environment sudah aktif lalu ulangi instalasi paket.
- Jika port 5173 atau 8000 sedang digunakan, hentikan proses yang memakai port tersebut atau jalankan server pada port lain dan sesuaikan konfigurasi frontend di `frontend/src/services/api.js`.
- Jika `json-repair` tidak terpasang, aplikasi masih memiliki fallback parser JSON, tetapi pemasangan paket tersebut lebih disarankan.

## Status Dokumentasi

File dokumentasi ini menggunakan format **Markdown** dengan ekstensi `.md`. Nama file yang umum digunakan untuk dokumentasi utama proyek adalah `README.md`, sehingga dapat ditampilkan otomatis oleh GitHub dan berbagai editor kode.
