import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1100, // maplibre is intentionally large; suppress false-positive warning
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor: cached independently from app code
          maplibre: ['maplibre-gl'],
          // Page-level splits: each lazy route ships as its own chunk so users
          // only download the JS for the module they're actually using.
          'page-flights': [
            './src/modules/flights/FlightsPage',
          ],
          'page-maritime': [
            './src/modules/maritime/MaritimePage',
          ],
        }
      }
    }
  }
})
