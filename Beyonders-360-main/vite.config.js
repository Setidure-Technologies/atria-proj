import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 4803,
    watch: {
      usePolling: true,
    },
    hmr: {
      port: 4803,
    }
  }
})