import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    fs: {
      allow: [
        // Allow serving the project directory and its src folder
        'D:/frontend_NOKIA/project',
        'D:/frontend_NOKIA/project/src',
        // Allow access to vibration JSON data (should be inside project for static serving)
        'D:/frontend_NOKIA/project/vibrationjson'
      ]
    },
    proxy: {
      // Proxy API calls to handle vibration data
      '/api/vibration-data': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vibration-data/, '/vibration-data')
      }
    }
  }
});

