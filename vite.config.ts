import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'framer-motion',
      'react-hot-toast'
    ]
  },
  build: {
    sourcemap: true
  },
  server: {
    fs: {
      strict: false
    }
  }
});