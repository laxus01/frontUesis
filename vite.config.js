import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow Railway host in dev server (if used)
    allowedHosts: ['frontuesis-production.up.railway.app'],
    host: true,
  },
  preview: {
    // Allow Railway host when running `vite preview`
    allowedHosts: ['frontuesis-production.up.railway.app'],
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
