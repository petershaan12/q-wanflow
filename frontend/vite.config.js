import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // target: 'http://localhost:8000',
        target: 'http://43.129.49.243:8080',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://43.129.49.243:8080',
        changeOrigin: true,
      },
    },
  },
})