import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy /news -> https://okhosty.xyz/Welcome/api for dev to avoid CORS
      '/news': {
        target: 'https://okhosty.xyz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/news/, '/Welcome/api')
      }
    }
  },
})
