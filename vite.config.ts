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
  // 部署在根路径下，不需要 nginx 子路径
  base: '/',
  server: {
    host: true,
    port: 5175,
    allowedHosts: ['localhost', '127.0.0.1'],
    proxy: {
      // dev 本地后端：/api/admin/xxx → admin-server:18082
      '/api/admin': {
        target: 'http://localhost:18082',
        changeOrigin: true,
      },
      // /static/xxx → admin-server:18082 后台上传目录
      '/static': {
        target: 'http://localhost:18082',
        changeOrigin: true,
      },
    },
  },
})
