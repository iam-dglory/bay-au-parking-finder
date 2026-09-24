import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import type { CarPark, ParkingSpot, SpotStatus } from '../types'
import { availability } from '../lib/availability'
import { MapOrientation } from './MapOrientation'


function pinIcon(color: string, state: string) {
  const mark = state === 'vacant' ? '✓' : state === 'occupied' ? '×' : ''
  const ring = state === 'uncertain' || state === 'unknown' ? 'box-shadow:0 0 0 3px rgba(100,116,139,.18), 0 2px 8px rgba(15,23,42,.24);' : 'box-shadow:0 2px 8px rgba(15,23,42,.24);'
  return L.divIcon({
    className: '',
    html: `<div title="${state === 'unknown' || state === 'uncertain' ? 'No current reading' : state}" style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid white;${ring}display:flex;align-items:center;justify-content:center;color:white;font:bold 17px/1 system-ui,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.22)">${mark || '<span style="width:8px;height:8px;border-radius:50%;background:white;opacity:.9"></span>'}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

/** The blue "you are here" dot. With `glow`, it gets a soft pulsing ring so
 * it's unmistakable at a glance, e.g. right after location resolves. */
function meIcon(glow?: boolean) {
  const pulse = glow
    ? `<div style="position:absolute;inset:-10px;border-radius:50%;background:rgba(59,130,246,0.35);animation:bay-me-pulse 1.8s ease-out infinite"></div>
       <style>@keyframes bay-me-pulse{0%{transform:scale(0.4);opacity:0.9}100%{transform:scale(2.2);opacity:0}}</style>`
    : ''
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:16px;height:16px">${pulse}<div style="position:relative;width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

/** A distinct square "P" marker for off-street car parks -- deliberately not
 * a coloured dot like on-street bays, since these are a different kind of
 * thing (a building with a total capacity, not a legal-status pin). */
function carParkIcon() {
  return L.divIcon({
    className: '',
    html: `<div title="Parking area" style="width:30px;height:30px;border-radius:9px;background:#2563eb;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;font-family:sans-serif;">P</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  })
}

function pickIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#6366f1;border:3px solid white;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })
}

function ResizeMap() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  const [lat, lng] = center
  useEffect(() => {
    map.setView([lat, lng], zoom)
  }, [lat, lng, zoom, map])
  return null
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function MapView({
  center,
  spots,
  onSelectSpot,
  pickMode,
  pickedLocation,
  onPickLocation,
  zoom = 15,
  glowMe = false,
  radiusM,
  myLocation,
  carParks = [],
}: {
  center: { lat: number; lng: number }
  spots: (ParkingSpot & { status: SpotStatus })[]
  onSelectSpot?: (spot: ParkingSpot & { status: SpotStatus }) => void
  pickMode?: boolean
  pickedLocation?: { lat: number; lng: number } | null
  onPickLocation?: (lat: number, lng: number) => void
  zoom?: number
  glowMe?: boolean
  /** Draws a dashed boundary at this radius so it's visually obvious where
   * search coverage ends, instead of the map silently going empty if you
   * pan or zoom out past it. */
  radiusM?: number
  /** Live GPS position for the "you are here" dot, tracked continuously as
   * the device moves. Kept separate from `center` (the search anchor) so the
   * dot moves smoothly while driving without the map force-recentering or
   * the parking search re-firing on every GPS tick. Falls back to `center`
   * when live tracking isn't available. */
  myLocation?: { lat: number; lng: number }
  /** Off-street car parks (multi-storey buildings/lots), shown as distinct
   * square "P" markers with a lightweight tap-to-view popup rather than the
   * full spot detail sheet, since they carry capacity, not legal rules. */
  carParks?: CarPark[]
}) {
  const mePosition = myLocation ?? center
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="h-full w-full" zoomControl={false} rotate touchRotate rotateControl={false}>
      <ResizeMap />
      <MapOrientation />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={[center.lat, center.lng]} zoom={zoom} />
      {radiusM && (
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusM}
          pathOptions={{ color: '#64748b', weight: 1.5, dashArray: '6 6', fillOpacity: 0.03 }}
        />
      )}
      <Marker position={[mePosition.lat, mePosition.lng]} icon={meIcon(glowMe)} />
      <MarkerClusterGroup chunkedLoading maxClusterRadius={50} spiderfyOnMaxZoom={false} disableClusteringAtZoom={18}>
        {spots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={pinIcon(availability(spot).color, availability(spot).state)}
            eventHandlers={{ click: () => onSelectSpot?.(spot) }}
          />
        ))}
      </MarkerClusterGroup>
      {carParks.map((cp) => (
        <Marker key={cp.id} position={[cp.lat, cp.lng]} icon={carParkIcon()}>
          <Popup>
            <div style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 220 }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{cp.address_text}</p>
              <p style={{ margin: '4px 0 0', color: '#4f46e5', fontWeight: 600 }}>~{cp.capacity} spaces</p>
              <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                From City of Melbourne's {cp.census_year} car park census. No live availability -- this is total
                capacity, not spots free right now.
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
      {pickMode && <ClickCatcher onPick={(lat, lng) => onPickLocation?.(lat, lng)} />}
      {pickedLocation && <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={pickIcon()} />}
    </MapContainer>
  )
}
