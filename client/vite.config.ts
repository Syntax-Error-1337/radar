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
    rollupOptions: {
      output: {
        // Split maplibre into its own chunk so it's cached independently from
        // app code. maplibre-gl is ~700kB minified — keeping it separate
        // means a single line of app code change doesn't bust this cache entry.
        manualChunks: {
          maplibre: ['maplibre-gl'],
        }
      }
    }
  }
})
