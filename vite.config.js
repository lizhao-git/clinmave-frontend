import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.htm'], // 包含HTM文件
  plugins: [
    vue(),
    vueDevTools(),
  ],
  base: '/clinmave/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      // 将所有以 /api 开头的请求代理到后端服务器
      '/clinmave/api': {
        // target: 'http://192.168.164.87:7777/clinmave',
        // target: 'http://localhost:12000/clinmave/',
        target: 'https://ngdc.cncb.ac.cn/clinmave/api/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/clinmave\/api/, ''), // 将 /clinmave/api 替换为空
      },
    }
  }
})