import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      // In dev, redirect bare / to /synclipt/ so the app loads on first open.
      // No base-path restriction in dev, so Vite serves index.html for every
      // path — React Router then handles /synclipt, /synclipt?tab=... etc.
      name: 'redirect-root',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/') {
            res.writeHead(302, { Location: '/synclipt/' })
            res.end()
            return
          }
          next()
        })
      },
    },
  ],
  // base only applies to production builds; dev runs without a path prefix
  // so Vite never rejects /synclipt?tab=... or any sub-path on refresh
  base: command === 'build' ? '/synclipt/' : '/',
  envDir: '../',
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws':  { target: 'ws://localhost:8000',  ws: true },
      '/media': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
}))
