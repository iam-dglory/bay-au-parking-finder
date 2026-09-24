import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import { Compass, RotateCcw, RotateCw } from 'lucide-react'
import { compassBearing } from '../lib/heading'

type OrientationAPI = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> }
export function MapOrientation() {
  const map = useMap()
  const [following, setFollowing] = useState(false)
  const [message, setMessage] = useState('')
  const active = useRef(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false; active.current = false } }, [])
  useEffect(() => {
    if (!following) return
    let gotReading = false
    const timeout = setTimeout(() => {
      if (!gotReading) { active.current = false; setFollowing(false); setMessage('No compass signal. Use the rotation arrows.') }
    }, 6000)
    const onOrientation = (raw: DeviceOrientationEvent) => {
      const bearing = compassBearing(raw, window.screen.orientation?.angle ?? (window as Window & { orientation?: number }).orientation ?? 0)
      if (bearing == null || !active.current) return
      gotReading = true
      clearTimeout(timeout)
      map.setBearing(bearing)
      setMessage('Compass on. Keep your phone flat for best results.')
    }
    window.addEventListener('deviceorientationabsolute', onOrientation)
    window.addEventListener('deviceorientation', onOrientation)
    return () => { clearTimeout(timeout); window.removeEventListener('deviceorientationabsolute', onOrientation); window.removeEventListener('deviceorientation', onOrientation) }
  }, [map, following])
  async function toggleCompass() {
    if (following) { active.current = false; setFollowing(false); setMessage('Compass off'); return }
    if (!window.isSecureContext || !('DeviceOrientationEvent' in window)) { setMessage('Compass unavailable. Use the rotation arrows.'); return }
    try {
      const api = DeviceOrientationEvent as OrientationAPI
      if (api.requestPermission && await api.requestPermission() !== 'granted') {
        if (alive.current) setMessage('Compass permission denied. You can still rotate manually.')
        return
      }
      if (!alive.current) return
      active.current = true
      setFollowing(true)
      setMessage('Waiting for compass…')
    } catch { if (alive.current) setMessage('Could not start compass. Use the rotation arrows.') }
  }
  function rotate(delta: number | null) {
    active.current = false
    setFollowing(false)
    map.setBearing(delta == null ? 0 : map.getBearing() + delta)
    setMessage(delta == null ? 'North up' : 'Manual rotation')
  }
  return <div className="absolute right-2 top-2 z-[500] max-w-[230px]" onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
    <div className="flex gap-1 rounded-lg bg-white p-1 shadow-md">
      <button className="rounded p-2" aria-label="Rotate map left" onClick={() => rotate(-30)}><RotateCcw size={19} /></button>
      <button className="rounded px-3 font-bold" aria-label="Reset map north" onClick={() => rotate(null)}>N</button>
      <button className="rounded p-2" aria-label="Rotate map right" onClick={() => rotate(30)}><RotateCw size={19} /></button>
      <button className={`rounded p-2 ${following ? 'bg-indigo-100 text-indigo-700' : ''}`} aria-label="Follow compass" aria-pressed={following} onClick={toggleCompass}><Compass size={19} /></button>
    </div>
    {message && <p role="status" className="mt-1 rounded bg-white/95 p-2 text-xs text-slate-700 shadow">{message}</p>}
  </div>
}
