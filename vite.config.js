import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 将所有以 /api 开头的请求代理到后端服务器
      '/api': {
        //target: 'http://localhost:12000', // 你的后端地址
        target: 'http://192.168.164.87:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '') // 可选：去掉 /api 前缀
      }
    }
  }
})
