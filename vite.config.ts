import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '')

  return {
    plugins: [vue(), tailwindcss()],
    build: {
      rolldownOptions: {
        // Without this, @remixicon/vue is not tree-shaken and bundles every icon.
        treeshake: { manualPureFunctions: ['defineComponent'] },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      // Dev only: with VITE_API_BASE_URL empty, /api calls are same-origin and need no CORS.
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
