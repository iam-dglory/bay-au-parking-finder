// Native builds load parking catalogs from the published web copy (VITE_ASSET_BASE_URL),
// so the ~250 MB data folder is removed from dist/ before `cap sync`.
import { rmSync, existsSync } from 'node:fs'
const dir = new URL('../dist/data', import.meta.url)
if (existsSync(dir)) { rmSync(dir, { recursive: true, force: true }); console.log('Removed dist/data from the native build') }
