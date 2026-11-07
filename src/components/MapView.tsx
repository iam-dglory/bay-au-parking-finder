import { useEffect, useRef } from 'react'
import { AdvancedMarker, APIProvider, ColorScheme, APILoadingStatus, Map, useApiLoadingStatus, useMap } from '@vis.gl/react-google-maps'
import type { CarPark, ParkingSpot, SpotStatus } from '../types'
import type { ParkingOption } from '../lib/parkingOptions'
import { availability } from '../lib/availability'
import { signNotation } from './Kerb'
import { formatCents } from '../lib/parkingCost'

const API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined)?.trim() ?? ''
const MAP_ID = (import.meta.env.VITE_GOOGLE_MAP_ID as string | undefined)?.trim() || 'DEMO_MAP_ID'
/** Plain markers for places without a price (other cities, sign reports). */
const MAX_PLAIN_MARKERS = 300

export const googleMapsConfigured = API_KEY.length > 0

type Point = { lat: number; lng: number }

export function MapView({
  center, spots, onSelectSpot, pickMode, pickedLocation, onPickLocation, zoom = 15, myLocation,
  carParks = [], onSelectCarPark, onZoomChange, options, selectedOptionId, onSelectOption,
}: {
  center: Point
  spots: (ParkingSpot & { status?: SpotStatus })[]
  onSelectSpot?: (spot: ParkingSpot & { status: SpotStatus }) => void
  pickMode?: boolean
  pickedLocation?: Point | null
  onPickLocation?: (lat: number, lng: number) => void
  zoom?: number
  /** Kept for compatibility; Google Maps draws its own location styling. */
  glowMe?: boolean
  radiusM?: number
  myLocation?: Point
  carParks?: CarPark[]
  onSelectCarPark?: (area: CarPark) => void
  onZoomChange?: (zoom: number) => void
  /** Priced options: drawn as price pills (the main home-screen layer). */
  options?: ParkingOption[]
  selectedOptionId?: string | null
  onSelectOption?: (option: ParkingOption) => void
}) {
  if (!googleMapsConfigured) return <MapUnavailable reason="The map key isn't set up yet." />
  return (
    <APIProvider apiKey={API_KEY}>
      <LoadState />
      <Map
        mapId={MAP_ID}
        colorScheme={ColorScheme.FOLLOW_SYSTEM}
        defaultCenter={center}
        defaultZoom={Math.min(zoom, 19)}
        gestureHandling="greedy"
        disableDefaultUI
        clickableIcons={false}
        className="h-full w-full"
        onZoomChanged={event => onZoomChange?.(event.detail.zoom)}
        onClick={event => { if (pickMode && event.detail.latLng) onPickLocation?.(event.detail.latLng.lat, event.detail.latLng.lng) }}
      >
        <Recenter center={center} zoom={zoom} />
        <AdvancedMarker position={myLocation ?? center} zIndex={1} title="You are here">
          <span className="block h-4 w-4 rounded-full border-[3px] border-white bg-[#102c40] shadow-[0_0_0_6px_rgba(219,255,0,.45)]" />
        </AdvancedMarker>

        {options?.map(option => (
          <AdvancedMarker key={option.id} position={{ lat: option.lat, lng: option.lng }} zIndex={option.id === selectedOptionId ? 50 : 10} onClick={() => onSelectOption?.(option)} title={option.name}>
            <PricePin option={option} selected={option.id === selectedOptionId} />
          </AdvancedMarker>
        ))}

        {spots.slice(0, MAX_PLAIN_MARKERS).map(spot => {
          const live = availability(spot).state
          const color = live === 'vacant' ? '#059669' : live === 'occupied' ? '#e11d48' : '#102c40'
          return (
            <AdvancedMarker key={spot.id} position={{ lat: spot.lat, lng: spot.lng }} zIndex={5} title={spot.address_text}
              onClick={() => spot.status && onSelectSpot?.(spot as ParkingSpot & { status: SpotStatus })}>
              <span className="block h-3.5 w-3.5 rounded-full border-2 border-white shadow" style={{ background: color }} />
            </AdvancedMarker>
          )
        })}

        {carParks.map(area => (
          <AdvancedMarker key={area.id} position={{ lat: area.lat, lng: area.lng }} zIndex={8} title={area.address_text} onClick={() => onSelectCarPark?.(area)}>
            <span className="flex h-7 w-7 items-center justify-center rounded-[6px] border-2 border-white bg-[#102c40] text-xs font-black text-white shadow-md">P</span>
          </AdvancedMarker>
        ))}

        {pickedLocation && (
          <AdvancedMarker position={pickedLocation} zIndex={60} title="Selected location">
            <span className="block h-5 w-5 rounded-full border-[3px] border-white bg-night shadow-lg" />
          </AdvancedMarker>
        )}
      </Map>
    </APIProvider>
  )
}

/** Map tags read like small sign plates: white with navy for streets, navy for
 * car parks, lime for the one you've picked. */
function PricePin({ option, selected }: { option: ParkingOption; selected: boolean }) {
  const blocked = option.fits === false
  const label = blocked ? (signNotation(option.limitMinutes) ?? 'Short')
    : option.cents === 0 ? 'Free'
    : option.cents != null ? formatCents(option.cents)
    : option.range ? `${formatCents(option.range.min)}+`
    : '?'
  const tone = selected ? 'bg-[#dbff00] text-[#102c40] shadow-[0_0_0_2px_#102c40,0_6px_16px_rgba(16,44,64,.35)] scale-110'
    : blocked ? 'bg-white text-[#8fa4b5] shadow-[0_0_0_1.5px_rgba(16,44,64,.2)]'
    : option.kind === 'carpark' ? 'bg-[#102c40] text-white shadow-[0_0_0_1.5px_rgba(255,255,255,.7),0_4px_12px_rgba(16,44,64,.3)]'
    : 'bg-white text-[#102c40] shadow-[0_0_0_1.5px_rgba(16,44,64,.35),0_4px_12px_rgba(16,44,64,.2)]'
  return (
    <span className={`figure flex items-center gap-1 whitespace-nowrap rounded-[6px] px-1.5 py-0.5 text-[13px] transition-transform ${tone}`}>
      {option.kind === 'carpark' && <span className="text-[11px] font-black">P</span>}
      {label}
      {option.live && option.live.free > 0 && <span className="ml-0.5 h-2 w-2 rounded-full bg-[#dbff00] shadow-[0_0_0_1.5px_#102c40]" aria-label={`${option.live.free} free now`} />}
    </span>
  )
}

/** Pans when the search centre changes, without fighting the user's own panning. */
function Recenter({ center, zoom }: { center: Point; zoom: number }) {
  const map = useMap()
  const last = useRef<string>('')
  useEffect(() => {
    const key = `${center.lat.toFixed(5)},${center.lng.toFixed(5)},${zoom}`
    if (!map || key === last.current) return
    last.current = key
    map.panTo(center)
    map.setZoom(Math.min(zoom, 19))
  }, [map, center, zoom])
  return null
}

function LoadState() {
  const status = useApiLoadingStatus()
  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE)
    return <div className="absolute inset-0 z-10"><MapUnavailable reason={status === APILoadingStatus.AUTH_FAILURE ? 'Google Maps rejected the API key. Check its website restrictions.' : 'Google Maps could not load. Check your connection.'} /></div>
  return null
}

/** Without a map: a quiet street grid, with the note up top so it never sits
 * under the floating buttons. */
function MapUnavailable({ reason }: { reason: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-tint-2">
      <div aria-hidden className="absolute inset-0 opacity-60 [background-image:linear-gradient(var(--line)_2px,transparent_2px),linear-gradient(90deg,var(--line)_2px,transparent_2px)] [background-size:96px_64px,96px_64px]" />
      <p className="absolute inset-x-0 top-[38%] px-8 text-center text-xs text-ink-3"><span className="font-bold text-ink-2">Map unavailable.</span> {reason} Prices and the list still work.</p>
    </div>
  )
}
