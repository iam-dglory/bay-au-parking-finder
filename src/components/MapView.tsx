import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import type { CarPark, ParkingSpot, SpotStatus } from '../types'
import { getStatusColors } from '../lib/statusColors'
import { getOccupancyInfo, getSensorOccupancyInfo, OCCUPANCY_CORROBORATION_THRESHOLD } from '../lib/occupancy'

/** A closer zoom for a tighter search radius, and a wider zoom for a bigger
 * one, so the map already fits the area being searched without the user
 * having to manually zoom in or out to see what's there. */
export function zoomForRadius(radiusM: number): number {
  if (radiusM <= 500) return 16
  if (radiusM <= 1000) return 15
  if (radiusM <= 2000) return 14
  return 13
}

function pinIcon(color: string, occupancyRing?: string) {
  const ring = occupancyRing ? `box-shadow:0 0 0 3px ${occupancyRing}, 0 1px 4px rgba(0,0,0,0.4);` : 'box-shadow:0 1px 4px rgba(0,0,0,0.4);'
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid white;${ring}"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
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
    html: `<div style="width:26px;height:26px;border-radius:6px;background:#4f46e5;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;font-family:sans-serif;">P</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
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

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center[0], center[1], zoom])
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

/** A ring colour around a pin when there's a live occupancy signal, so you can
 * tell a spot has been reported occupied/free without opening it. A single,
 * unconfirmed report gets a soft amber ring; once corroborated it gets a
 * solid colour matching the report. A confirmed "free" report isn't ringed
 * separately, since the pin is already green for a legally-free spot. */
function occupancyRingFor(spot: ParkingSpot): string | undefined {
  const sensor = getSensorOccupancyInfo(spot.sensor_status)
  if (sensor) return sensor.possiblyStuck ? '#f59e0b' : sensor.status === 'occupied' ? '#f43f5e' : '#3b82f6'
  const occupancy = getOccupancyInfo(spot.latest_ping)
  if (occupancy.status === 'unknown') return undefined
  const confirmed = occupancy.corroboratingCount >= OCCUPANCY_CORROBORATION_THRESHOLD
  if (occupancy.status === 'occupied') return confirmed ? '#f43f5e' : '#f59e0b'
  if (occupancy.status === 'free' && confirmed) return '#10b981'
  return undefined
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
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} className="h-full w-full" zoomControl={false}>
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
            icon={pinIcon(getStatusColors(spot.status).hex, occupancyRingFor(spot))}
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
