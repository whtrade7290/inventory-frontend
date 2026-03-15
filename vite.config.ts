import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // shadcn/ui 경로 별칭
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 백엔드 API 프록시 설정 (Spring Boot 8080 포트)
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
