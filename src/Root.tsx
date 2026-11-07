import { Suspense, lazy } from 'react'
import App from './App.tsx'

const Moderate = lazy(() => import('./pages/Moderate').then(module => ({ default: module.Moderate })))

/** ?moderate=1 opens the sign-review screen instead of the driver app. */
export function Root() {
  if (new URLSearchParams(window.location.search).get('moderate') === '1') return <Suspense fallback={null}><Moderate /></Suspense>
  return <App />
}
