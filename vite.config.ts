// import react from "@vitejs/plugin-react-swc";
// import path from "path";
// import { defineConfig } from "vite";

// // https://vitejs.dev/config/
// export default defineConfig({
//   server: {
//     host: "::",
//     port: 5173,
//     proxy: {
//       '/api': 'http://192.168.88.85:3000'
//     }
//   },
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src")
//     }
//   }
// });
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
        target: 'http://192.168.88.85:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq) => {
            console.debug('Proxying:', proxyReq.method, proxyReq.path);
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
    sourcemap: true
  }
});