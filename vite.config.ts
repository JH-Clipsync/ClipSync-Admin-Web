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
      // dev 本地后端：
      // 浏览器请求 /clipsync/admin/api/xxx（前端 baseURL=/clipsync/admin/api）
      // 后端实际路由 /api/admin/xxx，所以把 /clipsync/admin/api 替换为 /api/admin
      '/clipsync/admin/api': {
        target: 'http://localhost:28082',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/clipsync\/admin\/api/, '/api/admin'),
      },
      // /clipsync/admin/static/xxx → http://localhost:28082/static/xxx
      '/clipsync/admin/static': {
        target: 'http://localhost:28082',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/clipsync\/admin/, ''),
      },
    },
  },
})
