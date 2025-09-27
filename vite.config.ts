import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq) => {
            // Only log in development and with debug flag
            if (process.env.DEBUG) {
              console.debug('Proxying:', proxyReq.method, proxyReq.path);
            }
          });
        }
      }
    },
    cors: true
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  build: {
    // Generate sourcemaps only in development
    sourcemap: process.env.NODE_ENV !== 'production',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable aggressive code splitting
    rollupOptions: {
      output: {
        // Separate vendor chunks
        manualChunks: {
          // Split React into a separate chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Split UI components into a separate chunk
          'ui-components': [
            '@/components/ui/alert',
            '@/components/ui/button',
            '@/components/ui/dialog',
            '@/components/ui/input',
            '@/components/ui/select',
            '@/components/ui/table',
          ],
          // Split Redux into a separate chunk
          'redux-vendor': ['react-redux', '@reduxjs/toolkit'],
        },
        // Optimize chunk naming for better caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Minify output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
  },
});