import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/hardware/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: ["hardware-gui", "localhost"]
  }
})
