import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
 // Add this to serve static files from public folder
  publicDir: 'public',
  build: {
    outDir: 'dist',
    // Ensure favicon is included in build
    assetsInclude: ['**/*.ico']
  }

})