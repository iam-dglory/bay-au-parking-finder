/** Base-aware URL for the logo in `public/logo/`. A hardcoded "/logo/..."
 * path 404s once the app is deployed under a subpath (e.g. GitHub Pages'
 * "/bay-au-parking-finder/"), since only Vite's own asset pipeline gets the
 * base prefix automatically -- plain strings referencing public/ files do
 * not. BASE_URL always ends with a trailing slash. */
export const LOGO_URL = `${import.meta.env.BASE_URL}logo/bay-logo.png`
