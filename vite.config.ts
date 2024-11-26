import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths()
  ],
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
  server: {
    // Proxy API calls to the Express server running on port 5000
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
    // Vite development server settings for serving static files on port 5173
    fs: {
      strict: false
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: [
        'fs', 
        'path', 
        'http', 
        'https', 
        'zlib', 
        'stream', 
        'buffer', 
        'child_process', 
        'process', 
        'os', 
        'events', 
        'util', 
        'url', 
        'net', 
        'assert', 
        'readline',
        'worker_threads',
        'constants',
        'fileURLToPath'
      ]
    }
  },
  server: {
    fs: {
      strict: false
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils")
    },
  }
});
