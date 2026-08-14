import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // 部署在 /clipsync/admin/ 子路径下（与 router base、axios baseURL 保持一致）
  base: '/clipsync/admin/',
  server: {
    host: true,
    port: 5175,
    allowedHosts: ['localhost', '127.0.0.1'],
    proxy: {
      // dev 本地后端：/clipsync/admin/api/xxx → admin-server:28002/api/xxx
      '/clipsync/admin/api': {
        target: 'http://localhost:28002',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/clipsync\/admin/, ''),
      },
      // /clipsync/admin/static/xxx → admin-server:28002/static/xxx
      '/clipsync/admin/static': {
        target: 'http://localhost:28002',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/clipsync\/admin/, ''),
      },
    },
  },
})
