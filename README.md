🚀 AI CV Screening System
Aplikasi Otomatisasi Seleksi Kandidat & Matriks Komparatif Berbasis AI/ML
Membantu proses screening CV secara cepat, presisi, dan objektif untuk industri manufaktur.

📌 Fitur Utama
Sesi Rekrutmen: Membuat, mengedit nama sesi, dan mengelola folder sesi rekrutmen.
Batch Upload & Drag & Drop: Mengunggah banyak file PDF CV sekaligus.
Konversi PDF ke Markdown: Mengubah PDF CV secara layout-aware menjadi file Markdown (.md) menggunakan PyMuPDF4LLM tanpa ada data yang hilang.
Otomatisasi Ekstraksi Kontak: AI mengekstrak Nama, Email, Nomor Telepon (08.../+62...), dan Domisili kandidat.
Auto Rename File Fisik: Mengganti nama file PDF & MD di harddisk secara fisik menjadi Nama Asli Pelamar secara otomatis.
Ekstraksi PDF Lowongan Kerja: Mengunggah PDF Lowongan Kerja untuk mengekstrak kualifikasi dan tanggung jawab otomatis.
Kriteria & Skala Prioritas (1 - 10): Mengatur tingkat kepentingan kriteria tanpa batasan persentase.
3 Tabel Matriks Evaluasi AI:
Tabel 1: Evaluasi Persyaratan (✔️, ⚠️, ❌).
Tabel 2: Evaluasi Tanggung Jawab (✔️, ⚠️, ❌).
Tabel 3: Kesimpulan Ringkasan, Skor Kesesuaian (%), & Status Seleksi.
AI Recruiter Candidate Chatbot: Tanya-jawab interaktif seputar kandidat pelamar langsung di Dashboard.
Penyimpanan Lokal: Menyimpan file PDF, MD, kriteria (criteria.json), dan hasil analisis (result.json) di folder lokal backend/media/sessions/.
Token & Cost Tracker: Merekam dan menampilkan statistik pemakaian token serta estimasi biaya API secara realtime.
🛠️ Teknologi yang Digunakan
Backend (Python / Django)
Python (v3.10+)
Django & Django REST Framework (DRF)
SQLite (Metadata Sesi)
django-cors-headers (CORS Handling)
Requests (OpenRouter API Gateway)
PyMuPDF4LLM & PyMuPDF (fitz) (Konversi PDF ke Markdown & OCR Fallback)
python-dotenv (Membaca konfigurasi .env)
json-repair (Penambal sintaks JSON cacat buatan AI)
OpenRouter API dengan keluarga model Qwen (Alibaba Cloud)
Frontend (React / Vite / Tailwind)
React 19 & Vite
React Router DOM (Routing Navigasi)
Axios (HTTP Request Client)
Tailwind CSS (Styling UI)
Lucide React (Icon Pack)
Oxlint (Linter)
📋 Persiapan Sistem (Prerequisites)
Pastikan perangkat Anda sudah terinstall:

Python 3.10 atau lebih baru
Node.js 20.19 atau lebih baru & npm
Git (untuk manajemen versi)
OpenRouter API Key (untuk fitur AI Engine)
📁 Struktur Folder Utama
ai-cv-screening/
├── backend/
│   ├── manage.py
│   ├── core/
│   ├── screening/
│   ├── media/          <-- Penyimpanan lokal (PDF, MD, JSON)
│   └── db.sqlite3
├── frontend/
│   ├── package.json
│   ├── index.html
│   └── src/
└── README.md
