import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    rolldownOptions: {
      // @remixicon/vue memanggil defineComponent untuk ribuan ikon di satu file;
      // tanpa ini seluruh ikon ikut ter-bundle walau hanya sedikit yang dipakai.
      treeshake: { manualPureFunctions: ['defineComponent'] },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
