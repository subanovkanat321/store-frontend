/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Бэкенд (subanovkanat321/store) на ноутбуке: ./mvnw spring-boot:run
const backend = process.env.STORE_BACKEND ?? 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: {
    // Тот же origin, что на проде: браузер ходит на localhost:5173, а Vite передаёт
    // /api и /media в Spring Boot. Поэтому не нужен CORS, и cookie (сессия, XSRF-TOKEN)
    // работают так же, как за nginx
    proxy: {
      '/api': backend,
      '/media': backend,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Подменённые в тесте глобальные объекты возвращаются после каждого теста
    unstubGlobals: true,
  },
})
