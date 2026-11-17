import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

/** One id per build. The web app compares it with dist/version.json to spot a
 * newer deploy and reload itself (see src/lib/autoUpdate.ts). */
const BUILD_ID = new Date().toISOString()

function versionFile(): Plugin {
  return {
    name: 'bay-version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) })
    },
  }
}

export default defineConfig({
  // GitHub Pages uses a repository path; CloudFront and local builds use '/'.
  base: process.env.VITE_APP_BASE_PATH ?? './',
  // AWS deploys public runtime assets separately so shell builds stay small.
  publicDir: process.env.VITE_SKIP_PUBLIC_COPY === 'true' ? false : 'public',
  plugins: [react(), tailwindcss(), versionFile()],
  define: { __BAY_BUILD__: JSON.stringify(BUILD_ID) },
  // Source archives contain third-party HTML; only our app entry is executable.
  optimizeDeps: { entries: ['index.html'] },
  server: {
    host: true,
  },
})
