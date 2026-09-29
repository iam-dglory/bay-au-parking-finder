import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polygon, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import type { CarPark, ParkingSpot, SpotStatus } from '../types'
import { availability } from '../lib/availability'
import { MapOrientation } from './MapOrientation'
import { ParkingAreaDetails } from './ParkingAreaDetails'


function pinIcon(color: string, state: string) {
  const label = state === 'unknown' || state === 'uncertain' ? 'Availability on arrival' : state === 'vacant' ? 'Vacant' : 'Occupied'
  const ring = state === 'uncertain' || state === 'unknown' ? 'box-shadow:0 0 0 3px rgba(100,116,139,.18), 0 2px 8px rgba(15,23,42,.24);' : 'box-shadow:0 2px 8px rgba(15,23,42,.24);'
  return L.divIcon({
    className: '',
    // Colour and the accessible title carry the state; glyphs are ambiguous at phone scale.
    html: `<div title="${label}" aria-label="${label}" style="width:30px;height:30px;border-radius:50%;background:${color};border:3px solid white;${ring}display:flex;align-items:center;justify-content:center"><span style="width:8px;height:8px;border-radius:50%;background:white;opacity:.92"></span></div>`,
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

function meterIcon() {
  return L.divIcon({
    className: '',
    html: `<div title="Mapped SFMTA parking meter · availability on arrival" aria-label="Mapped SFMTA parking meter" style="width:30px;height:30px;border-radius:9px;background:#475569;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:13px;font-family:sans-serif">M</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15],
  })
}

function meterGroupIcon(count: number) {
  const label = `${count} SFMTA meter locations · zoom in for details`
  return L.divIcon({className: '', iconSize: [44, 44], iconAnchor: [22, 22],
    html: `<div title="${label}" aria-label="${label}" style="width:44px;height:44px;border-radius:12px;background:#475569;color:white;border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,.25);display:flex;align-items:center;justify-content:center;gap:2px;font:700 11px/1 sans-serif"><span>M</span><span>${count}</span></div>`})
}

function clusterIcon(cluster: { getChildCount(): number }, areas = false) {
  const count = cluster.getChildCount()
  const label = `${count} ${areas ? 'parking areas' : 'mapped parking spots'} · zoom in for details`
  // Cluster colour describes the layer, not its size or presumed vacancy.
  return L.divIcon({className:'',iconSize:[44,44],iconAnchor:[22,22],html:`<div title="${label}" aria-label="${label}" style="width:44px;height:44px;border-radius:${areas ? '12px' : '50%'};background:${areas ? '#2563eb' : '#475569'};color:white;border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,.25);display:flex;flex-direction:column;align-items:center;justify-content:center;font:600 12px/1.1 sans-serif">${areas ? '<span style="font-size:10px">P</span>' : ''}${count}</div>`})
}

/** Aggregate dense meter inventory before making Leaflet markers. At street
 * zoom, only markers in the visible map bounds are mounted on the phone. */
function SfMeterMarkers({spots, onSelectSpot}: {
  spots: (ParkingSpot & {status: SpotStatus})[]
  onSelectSpot?: (spot: ParkingSpot & {status: SpotStatus}) => void
}) {
  const map = useMap()
  const [view, setView] = useState(() => ({zoom: map.getZoom(), bounds: map.getBounds()}))
  useMapEvents({zoomend: () => setView({zoom: map.getZoom(), bounds: map.getBounds()}),
    moveend: () => setView({zoom: map.getZoom(), bounds: map.getBounds()})})
  const markers = useMemo(() => {
    const bounds = view.bounds.pad(.3)
    const visible = spots.filter(spot => bounds.contains([spot.lat, spot.lng]))
    if (view.zoom >= 19) return visible.map(spot => ({lat: spot.lat, lng: spot.lng, spot, count: 1}))
    const cell = view.zoom <= 15 ? .003 : view.zoom === 16 ? .002 : view.zoom === 17 ? .0012 : .00035
    const bins = new Map<string, typeof visible>()
    for (const spot of visible) {
      const key = `${Math.floor(spot.lat / cell)}_${Math.floor(spot.lng / cell)}`
      const group = bins.get(key)
      if (group) group.push(spot)
      else bins.set(key, [spot])
    }
    return [...bins.values()].map(group => ({lat: group.reduce((n, spot) => n + spot.lat, 0) / group.length,
      lng: group.reduce((n, spot) => n + spot.lng, 0) / group.length,
      spot: group.length === 1 ? group[0] : null, count: group.length}))
  }, [spots, view])
  return <>{markers.map((marker, i) => <Marker key={marker.spot?.id ?? `meter-group-${i}`}
    position={[marker.lat, marker.lng]} icon={marker.spot ? meterIcon() : meterGroupIcon(marker.count)}
    eventHandlers={{click: () => marker.spot ? onSelectSpot?.(marker.spot) : map.flyTo([marker.lat, marker.lng], Math.min(19, view.zoom + 2))}} />)}</>
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
  const meterSpots = spots.filter(spot => spot.catalog?.source_name === 'SFMTA meter inventory')
  const otherSpots = spots.filter(spot => spot.catalog?.source_name !== 'SFMTA meter inventory')
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} maxZoom={19} className="h-full w-full" zoomControl={false} rotate touchRotate rotateControl={false}>
      <ResizeMap />
      <MapOrientation />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
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
      <SfMeterMarkers spots={meterSpots} onSelectSpot={onSelectSpot} />
      <MarkerClusterGroup iconCreateFunction={(cluster: {getChildCount():number})=>clusterIcon(cluster)} chunkedLoading maxClusterRadius={50} spiderfyOnMaxZoom={false} disableClusteringAtZoom={18}>
        {otherSpots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            icon={pinIcon(availability(spot).color, availability(spot).state)}
            eventHandlers={{ click: () => onSelectSpot?.(spot) }}
          />
        ))}
      </MarkerClusterGroup>
      {carParks.filter(area => area.boundary?.length).map(area => <Polygon key={`boundary:${area.id}`} positions={area.boundary!} pathOptions={{color:'#2563eb', weight:2, fillOpacity:.12}}>
        <Popup><div style={{maxWidth:280,maxHeight:'50vh',overflowY:'auto'}}><ParkingAreaDetails area={area} /></div></Popup>
      </Polygon>)}
      <MarkerClusterGroup iconCreateFunction={(cluster: {getChildCount():number})=>clusterIcon(cluster,true)} chunkedLoading maxClusterRadius={35} disableClusteringAtZoom={17}>
      {carParks.map((cp) => (
        <Marker key={cp.id} position={[cp.lat, cp.lng]} icon={carParkIcon()}>
          <Popup>
            <div style={{ maxWidth: 280, maxHeight: '50vh', overflowY:'auto' }}>
              <ParkingAreaDetails area={cp} />
            </div>
          </Popup>
        </Marker>
      ))}
      </MarkerClusterGroup>
      {pickMode && <ClickCatcher onPick={(lat, lng) => onPickLocation?.(lat, lng)} />}
      {pickedLocation && <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={pickIcon()} />}
    </MapContainer>
  )
}
