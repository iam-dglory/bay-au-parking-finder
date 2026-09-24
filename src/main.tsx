import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import './index.css'
import App from './App.tsx'
import L from 'leaflet'

// The rotation plugin extends the same Leaflet instance used by react-leaflet.
;(window as Window & { L?: typeof L }).L = L
await import('leaflet-rotate/dist/leaflet-rotate.js')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
