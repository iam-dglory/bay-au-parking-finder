import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Root } from './Root.tsx'
import { startAutoUpdate } from './lib/autoUpdate'

if (import.meta.env.PROD) startAutoUpdate()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
