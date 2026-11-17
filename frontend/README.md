# Frontend AI CV Screening

Antarmuka React + Vite untuk aplikasi AI CV Screening. Dokumentasi lengkap (instalasi, konfigurasi, cara pakai, dan daftar endpoint) ada di [`../README.md`](../README.md).

## Perintah

```bash
npm install     # pasang dependensi
npm run dev     # server pengembangan (default http://localhost:5173)
npm run build   # build produksi ke dist/
npm run preview # pratinjau hasil build
npm run lint    # lint dengan oxlint
```

Backend Django wajib berjalan di `http://127.0.0.1:8000`; alamatnya diatur di `src/services/api.js` (`baseURL`).
