import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AttributionControl, Map as MLMap, Marker, setWorkerUrl, type StyleSpecification } from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { CarPark, ParkingSpot, SpotStatus } from '../types'
import type { ParkingOption } from '../lib/parkingOptions'
import { availability } from '../lib/availability'
import { MapUnavailable, MeDot, PricePin, type Point } from './MapPins'

setWorkerUrl(workerUrl)

/** Free vector tiles from OpenFreeMap (no key, no usage limits; OpenStreetMap data). */
const STYLE_URL = { light: 'https://tiles.openfreemap.org/styles/positron', dark: 'https://tiles.openfreemap.org/styles/dark' }
const USE_GOOGLE = (import.meta.env.VITE_MAP_PROVIDER as string | undefined) === 'google' && !!(import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim()
// Only downloaded when switched on.
const GoogleMapView = lazy(() => import('./GoogleMapView').then(m => ({ default: m.GoogleMapView })))
const MAX_PLAIN_MARKERS = 300

type Props = {
  center: Point
  spots: (ParkingSpot & { status?: SpotStatus })[]
  onSelectSpot?: (spot: ParkingSpot & { status: SpotStatus }) => void
  pickMode?: boolean
  pickedLocation?: Point | null
  onPickLocation?: (lat: number, lng: number) => void
  zoom?: number
  glowMe?: boolean
  radiusM?: number
  myLocation?: Point
  carParks?: CarPark[]
  onSelectCarPark?: (area: CarPark) => void
  onZoomChange?: (zoom: number) => void
  options?: ParkingOption[]
  selectedOptionId?: string | null
  onSelectOption?: (option: ParkingOption) => void
}

export function MapView(props: Props) {
  if (USE_GOOGLE) return <Suspense fallback={null}><GoogleMapView {...props} /></Suspense>
  return <LibreMap {...props} />
}

function useDarkMode() {
  const query = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-color-scheme: dark)') : undefined
  const [dark, setDark] = useState(() => !!query?.matches)
  useEffect(() => {
    if (!query) return
    const on = (e: MediaQueryListEvent) => setDark(e.matches)
    query.addEventListener('change', on)
    return () => query.removeEventListener('change', on)
  }, [query])
  return dark
}

function LibreMap({ center, spots, onSelectSpot, pickMode, pickedLocation, onPickLocation, zoom = 15, myLocation, carParks = [], onSelectCarPark, onZoomChange, options, selectedOptionId, onSelectOption }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MLMap | null>(null)
  const [failed, setFailed] = useState(false)
  const dark = useDarkMode()
  const darkRef = useRef(dark)
  darkRef.current = dark
  const handlers = useRef({ onPickLocation, onZoomChange, pickMode })
  handlers.current = { onPickLocation, onZoomChange, pickMode }

  // Create the map once.
  useEffect(() => {
    if (!container.current) return
    let instance: MLMap
    try {
      instance = new MLMap({
        container: container.current,
        style: STYLE_URL[dark ? 'dark' : 'light'],
        center: [center.lng, center.lat],
        zoom: Math.min(zoom, 19) - 1, // MapLibre tiles are 512 px: one level less shows the same area as Google
        attributionControl: false,
        pitchWithRotate: false,
        dragRotate: false,
        fadeDuration: 0,
      })
    } catch { setFailed(true); return }
    instance.touchZoomRotate.disableRotation()
    instance.addControl(new AttributionControl({ compact: true }), 'top-left')
    instance.on('style.load', () => themeMap(instance, darkRef.current))
    instance.on('load', () => setMap(instance))
    instance.on('error', e => { if (!instance.loaded() && /Failed to fetch|NetworkError|style/i.test(String(e.error?.message))) setFailed(true) })
    instance.on('click', e => { if (handlers.current.pickMode) handlers.current.onPickLocation?.(e.lngLat.lat, e.lngLat.lng) })
    instance.on('zoomend', () => handlers.current.onZoomChange?.(instance.getZoom() + 1))
    return () => { instance.remove(); setMap(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; centre, zoom and theme are applied below
  }, [])

  // Follow the phone's light/dark setting.
  const firstTheme = useRef(true)
  useEffect(() => {
    if (!map) return
    if (firstTheme.current) { firstTheme.current = false; return }
    map.setStyle(STYLE_URL[dark ? 'dark' : 'light'])
  }, [map, dark])

  // Pan when the search centre changes, without fighting the user's own panning.
  const last = useRef('')
  useEffect(() => {
    if (!map) return
    const key = `${center.lat.toFixed(5)},${center.lng.toFixed(5)},${zoom}`
    if (key === last.current) return
    const first = last.current === ''
    last.current = key
    const to = { center: [center.lng, center.lat] as [number, number], zoom: Math.min(zoom, 19) - 1 }
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (first || reduce) map.jumpTo(to); else map.easeTo({ ...to, duration: 450 })
  }, [map, center, zoom])

  if (failed) return <MapUnavailable reason="The map couldn't load. Check your connection." />

  return <div className="relative h-full w-full bg-tint-2">
    <div ref={container} className="bay-map absolute inset-0" />
    {map && <>
      <Pin map={map} at={myLocation ?? center} z={1} label="You are here"><MeDot /></Pin>
      {options?.map(option => (
        <Pin key={option.id} map={map} at={option} z={option.id === selectedOptionId ? 50 : 10} label={option.name} onClick={() => onSelectOption?.(option)}>
          <PricePin option={option} selected={option.id === selectedOptionId} />
        </Pin>
      ))}
      {spots.slice(0, MAX_PLAIN_MARKERS).map(spot => {
        const live = availability(spot).state
        const color = live === 'vacant' ? '#059669' : live === 'occupied' ? '#e11d48' : '#102c40'
        return <Pin key={spot.id} map={map} at={spot} z={5} label={spot.address_text} onClick={() => spot.status && onSelectSpot?.(spot as ParkingSpot & { status: SpotStatus })}>
          <span className="block h-3.5 w-3.5 rounded-full border-2 border-white shadow" style={{ background: color }} />
        </Pin>
      })}
      {carParks.map(area => (
        <Pin key={area.id} map={map} at={area} z={8} label={area.address_text} onClick={() => onSelectCarPark?.(area)}>
          <span className="flex h-7 w-7 items-center justify-center rounded-[6px] border-2 border-white bg-[#102c40] text-xs font-black text-white shadow-md">P</span>
        </Pin>
      ))}
      {pickedLocation && <Pin map={map} at={pickedLocation} z={60} label="Selected location"><span className="block h-5 w-5 rounded-full border-[3px] border-white bg-night shadow-lg" /></Pin>}
    </>}
  </div>
}

/** A React-rendered marker. The element stays the same across renders, so
 * markers don't flicker when prices or the selection change. */
function Pin({ map, at, z, label, onClick, children }: { map: MLMap; at: Point; z: number; label: string; onClick?: () => void; children: ReactNode }) {
  const el = useMemo(() => document.createElement('div'), [])
  const marker = useRef<Marker | null>(null)
  const click = useRef(onClick)
  click.current = onClick
  useEffect(() => {
    const m = new Marker({ element: el, anchor: 'center' }).setLngLat([at.lng, at.lat]).addTo(map)
    const handle = (e: MouseEvent) => { if (click.current) { e.stopPropagation(); click.current() } }
    el.addEventListener('click', handle)
    marker.current = m
    return () => { el.removeEventListener('click', handle); m.remove() }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- position is updated below
  }, [map, el])
  useEffect(() => { marker.current?.setLngLat([at.lng, at.lat]) }, [at.lat, at.lng])
  useEffect(() => {
    el.style.zIndex = String(z)
    el.title = label
    el.style.cursor = onClick ? 'pointer' : 'default'
    if (onClick) { el.setAttribute('role', 'button'); el.setAttribute('aria-label', label) }
  }, [el, z, label, onClick])
  return createPortal(children, el)
}

/** Recolours OpenFreeMap's Positron/Dark styles into Bay's navy, cloud white
 * and lime, keeping roads readable and dropping visual noise. */
function themeMap(map: MLMap, dark: boolean) {
  const c = dark
    ? { bg: '#0a1d2b', water: '#0c2a3e', park: '#0f2a26', building: '#12293a', minor: '#1b3a51', major: '#25506e', casing: '#0a1d2b', rail: '#1d3d55', label: '#9db1c1', halo: '#0a1d2b' }
    : { bg: '#f7fafc', water: '#cddfeb', park: '#e8f1d6', building: '#e7edf2', minor: '#ffffff', major: '#ffffff', casing: '#d3dde5', rail: '#d3dde5', label: '#3e5568', halo: '#ffffff' }
  const style = map.getStyle() as StyleSpecification | undefined
  for (const layer of style?.layers ?? []) {
    const id = layer.id
    const set = (prop: string, value: unknown) => { try { map.setPaintProperty(id, prop as never, value as never) } catch { /* not on this layer */ } }
    if (layer.type === 'background') set('background-color', c.bg)
    else if (layer.type === 'fill' && /water/.test(id)) set('fill-color', c.water)
    else if (layer.type === 'fill' && /park|wood|grass/.test(id)) set('fill-color', c.park)
    else if (layer.type === 'fill' && /building/.test(id)) { set('fill-color', c.building); set('fill-outline-color', c.casing) }
    else if (layer.type === 'fill' && /landuse_residential/.test(id)) set('fill-color', c.bg)
    else if (layer.type === 'line' && /casing/.test(id)) set('line-color', c.casing)
    else if (layer.type === 'line' && /highway_(major|motorway)/.test(id)) set('line-color', c.major)
    else if (layer.type === 'line' && /highway_(minor|path)|road/.test(id)) set('line-color', c.minor)
    else if (layer.type === 'line' && /rail/.test(id)) set('line-color', c.rail)
    else if (layer.type === 'line' && /waterway/.test(id)) set('line-color', c.water)
    else if (layer.type === 'symbol') { set('text-color', c.label); set('text-halo-color', c.halo) }
  }
}
