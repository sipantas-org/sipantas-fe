# SIPANTAS-FE

Frontend SIPANTAS dengan dua role, admin dan surveyor, yang memakai halaman sama dengan tema warna berbeda.

Stack: Vue 3, TypeScript, Vite, Tailwind CSS v4, shadcn-vue, Pinia, Vue Router.

## Menjalankan

```bash
npm install
cp .env.example .env   # atur VITE_API_BASE_URL ke alamat backend
npm run dev
```

Perintah lain: `npm run build` (pemeriksaan tipe dan build), `npm run preview`.

## Konfigurasi

| Variabel | Fungsi |
|---|---|
| `VITE_API_BASE_URL` | Alamat backend (default `http://localhost:3000`). CORS diatur di backend. |
