import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js', 'src/**/*.jsx'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/main.jsx', 'src/globe/**'],
    },
  },
})
