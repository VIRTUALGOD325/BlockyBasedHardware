import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/hardware/',
  plugins: [react()],
  server: {
    allowedHosts: ["hardware-gui", "localhost"]
  }
})
