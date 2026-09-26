import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  // Source archives contain third-party HTML; only our app entry is executable.
  optimizeDeps: { entries: ['index.html'] },
  server: {
    host: true,
  },
})
