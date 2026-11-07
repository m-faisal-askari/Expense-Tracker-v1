import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: env.VITE_API_URL
        ? {
            '/api': {
              target: env.VITE_API_URL,
              changeOrigin: true,
              secure: true,
            },
          }
        : undefined,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
    },
  }
})
