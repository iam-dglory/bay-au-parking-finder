import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages uses a repository path; CloudFront and local builds use '/'.
  base: process.env.VITE_APP_BASE_PATH ?? './',
  // AWS deploys public runtime assets separately so shell builds stay small.
  publicDir: process.env.VITE_SKIP_PUBLIC_COPY === 'true' ? false : 'public',
  plugins: [react(), tailwindcss()],
  // Source archives contain third-party HTML; only our app entry is executable.
  optimizeDeps: { entries: ['index.html'] },
  server: {
    host: true,
  },
})
