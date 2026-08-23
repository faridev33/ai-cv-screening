🚀 AI CV Screening System

    Sistem Otomatisasi Seleksi Kandidat & Matriks Komparatif Berbasis AI/ML
    Solusi Rekrutmen Massal Cepat, Objektif, dan Efisien untuk Industri Manufaktur.

📌 Ringkasan Proyek

Aplikasi AI CV Screening System dirancang untuk membantu tim HR memproses, mengekstrak, dan mengevaluasi puluhan hingga ratusan CV pelamar secara otomatis dan objektif dalam hitungan detik.

Sistem ini mengubah dokumen PDF kaku menjadi data terstruktur (Markdown) menggunakan PyMuPDF4LLM, meringkas data kontak pelamar, secara otomatis mengganti nama file PDF di harddisk menjadi Nama Asli Pelamar, serta menghasilkan 3 Tabel Matriks Evaluasi Komparatif menggunakan Qwen AI Engine (Alibaba Cloud via OpenRouter API).
🛠️ Teknologi & Stack yang Digunakan
1. Backend (Python / Django)

    Django REST Framework (DRF): Framework backend utama penyedia REST API.

    Django CORS Headers: Mengatur izin akses komunikasi antara React (Frontend) dan Django (Backend).

    PyMuPDF4LLM & PyMuPDF (fitz): Parser PDF layout-aware untuk konversi PDF ke Markdown (.md) dan OCR Fallback untuk PDF bergambar/scan.

    Requests & Python-Dotenv: Menghubungkan backend ke OpenRouter API dan membaca variabel lingkungan .env.

    JSON-Repair: Library penambal sintaks JSON cacat otomatis buatan AI agar backend 100% bebas dari JSONDecodeError.

    File-System Storage: Sistem penyimpanan terstruktur di disk lokal (raw_cv/, parsed_cv/, criteria.json, result.json) tanpa overhead database rumit.

2. Frontend (React.js / Vite / Tailwind CSS)

    Vite + React.js: Bundler & framework frontend modern berkecepatan tinggi.

    Tailwind CSS: Framework CSS untuk desain antarmuka (UI/UX) yang responsif dan elegan.

    Axios: Client HTTP untuk mengirim request ke Backend Django.

    React Router DOM: Navigasi antar halaman (Main Page & Detail Page).

    Lucide React: Icon pack modern.

3. AI Engine & Infrastructure

    OpenRouter API Gateway: Gateway koneksi aman ke model AI tingkat lanjut.

    Qwen 2.5 / 3.7 / 3.8 Family (Alibaba Cloud):

        qwen/qwen3.8-max (Default Flagship - 1.000.000 Tokens Context)

        qwen/qwen3.7-flash (Super Cepat & Cheap)

        qwen/qwen-2.5-72b-instruct (Classic Standard)

✨ Fitur-Fitur Utama Aplikasi

    Dashboard Rekrutmen Realtime:

        Menampilkan statistik total CV terunggah, jumlah kandidat lolos, dan rata-rata skor.

        Highlight Kandidat Rekomendasi Utama (#1 Rank) dan Leaderboard Peringkat Seluruh Pelamar.

    Manajemen CV (Batch Upload & Drag & Drop):

        Upload banyak file PDF sekaligus (Batch Upload).

        Otomatisasi Penuh: PDF diunggah ➔ Otomatis konversi ke .md ➔ AI ekstrak kontak ➔ Nama file PDF & MD di harddisk otomatis berganti menjadi Nama Asli Pelamar.

        Button 1-Klik Salin Kontak: Tombol salin Email & No HP (08.../+62...) dengan balasan cepat "Tersalin!".

        Tombol Coba Lagi AI (Retry): Memproses ulang file spesifik jika sempat gagal.

    Hasil Analisa AI (3 Tabel Matriks Komparatif):

        Upload PDF Lowongan Kerja: Ekstraksi otomatis kualifikasi & tanggung jawab dari PDF lowongan.

        Skala Prioritas 1 - 10: Mengatur tingkat kepentingan kriteria tanpa batasan persentase.

        3 Tabel Evaluasi AI:

            Tabel 1: Evaluasi Persyaratan (✔️, ⚠️, ❌).

            Tabel 2: Evaluasi Tanggung Jawab (✔️, ⚠️, ❌).

            Tabel 3: Kesimpulan Ringkasan, Skor Kesesuaian (%), & Status Seleksi (LOLOS Rekomendasi Utama, LOLOS, TIDAK LOLOS).

    Token & Pengaturan:

        Merekut & menampilkan Total Token Terpakai dan Estimasi Biaya ($ USD / Rp) secara realtime.

        Pemilihan 51 Varian Model Qwen.

        Fitur Tes Koneksi AI 1-Klik.

📋 Prasyarat Sistem (Prerequisites)

Sebelum menjalankan proyek, pastikan komputer Anda telah terinstall:

    Python (Versi 3.10 atau lebih baru)

    Node.js (Versi 18 atau lebih baru) & npm

📦 Panduan Instalasi Paket (Dependencies)
1. Setup Backend (Django)

Buka terminal dan masuk ke folder backend:
code Powershell

# 1. Masuk ke folder backend
cd backend

# 2. Buat Virtual Environment Python (jika belum ada)
python -m venv venv

# 3. Aktifkan Virtual Environment
# Windows PowerShell:
..\venv\Scripts\activate
# Mac/Linux:
source ../venv/bin/activate

# 4. Install seluruh library Python yang dibutuhkan
pip install django djangorestframework django-cors-headers pymupdf4llm PyMuPDF requests python-dotenv json-repair

2. Setup Frontend (React / Vite)

Buka terminal baru dan masuk ke folder frontend:
code Powershell

# 1. Masuk ke folder frontend
cd frontend

# 2. Install seluruh modul Node.js
npm install
npm install axios react-router-dom lucide-react
npm install -D tailwindcss postcss autoprefixer

⚙️ Konfigurasi API Key (.env)

Buat file bernama .env di dalam folder backend/ media / env / .env, lalu isi dengan API Key OpenRouter Anda:
code Env

# Isi file backend/.env
MY_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MODEL_NAME=qwen/qwen3.8-max

    Catatan: API Key juga dapat dimasukkan secara langsung melalui antarmuka web pada tab Token & Pengaturan.

🚀 Cara Menjalankan Aplikasi
Langkah 1: Jalankan Backend Django

Buka terminal 1 (di folder backend dengan venv aktif):
code Powershell

# 1. Jalankan Migrasi Database SQLite
python manage.py makemigrations
python manage.py migrate

# 2. Jalankan Server Django
python manage.py runserver

(Server backend akan berjalan di: http://127.0.0.1:8000/)
Langkah 2: Jalankan Frontend React

Buka terminal 2 (di folder frontend):
code Powershell

npm run dev

(Server frontend akan berjalan di: http://localhost:5173/)
Langkah 3: Buka Aplikasi di Browser

Buka browser Anda dan akses URL:
👉 http://localhost:5173/
📁 Struktur Penyimpanan Folder Lokal (media/sessions/)

Setiap kali Anda membuat sesi rekrutmen baru, backend akan secara otomatis membuat struktur direktori di harddisk laptop Anda:
code Text

backend/media/sessions/
└── session_<UUID>/             <-- Folder Sesi Spesifik
    ├── raw_cv/                 <-- PDF CV Asli (Otomatis Di-rename ke Nama Pelamar)
    │   ├── Ahmad Rizal.pdf
    │   └── Siti Nurhaliza.pdf
    ├── parsed_cv/              <-- Teks Mentah Markdown (.md)
    │   ├── Ahmad Rizal.md
    │   └── Siti Nurhaliza.md
    ├── job_desc.md             <-- Deskripsi Lowongan Pekerjaan
    ├── criteria.json           <-- Daftar Kriteria & Skala Prioritas (1 - 10)
    └── result.json             <-- Hasil Ekstraksi Kontak & 3 Tabel Matriks AI