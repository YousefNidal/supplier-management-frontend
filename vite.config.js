import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // Ensure it listens on all interfaces in Docker
    proxy: {
      // Node.js backend (suppliers, orders, auth)
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      // Python backend (Playerok API via playerok-requests-api)
      '/playerok-api': {
        target: process.env.VITE_PLAYEROK_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/playerok-api/, '')
      }
    }
  }
})


