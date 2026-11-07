import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/overpass/wght.css'
import '@fontsource/overpass-mono/600.css'
import './index.css'
import { Root } from './Root.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
