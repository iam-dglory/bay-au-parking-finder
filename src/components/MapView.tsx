import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Circle, Polygon, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import type { CarPark, ParkingSpot, SpotStatus } from '../types'
import { availability } from '../lib/availability'
import { MapOrientation } from './MapOrientation'


function pinMarkup(color: string, label: string, content: string) {
  return `<div title="${label}" aria-label="${label}" style="position:relative;width:40px;height:48px;filter:drop-shadow(0 3px 5px rgba(15,23,42,.22))"><div style="position:absolute;left:4px;top:1px;width:32px;height:32px;border-radius:50% 50% 50% 0;background:${color};border:3px solid white;transform:rotate(-45deg)"><span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(45deg);color:white;font:800 12px/1 sans-serif">${content}</span></div></div>`
}

function pinIcon(color: string, state: string) {
  const label = state === 'unknown' || state === 'uncertain' ? 'Availability on arrival' : state === 'vacant' ? 'Vacant' : 'Occupied'
  // Unknown means no live reading, not a grey “disabled” point. Blue keeps
  // it discoverable while the accessible title explains the evidence level.
  const visualColor = state === 'unknown' || state === 'uncertain' ? '#1769ff' : color
  return L.divIcon({
    className: '',
    html: pinMarkup(visualColor, label, 'P'),
    iconSize: [40, 48],
    iconAnchor: [20, 40],
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
    html: pinMarkup('#1769ff', 'Parking area', 'P'),
    iconSize: [40, 48],
    iconAnchor: [20, 40],
  })
}

function meterIcon() {
  return L.divIcon({
    className: '',
    html: pinMarkup('#1769ff', 'Mapped SFMTA parking meter · availability on arrival', 'P'),
    iconSize: [40, 48], iconAnchor: [20, 40],
  })
}

function meterGroupIcon(count: number) {
  const label = `${count} SFMTA meter locations · zoom in for details`
  return L.divIcon({className: '', iconSize: [40, 48], iconAnchor: [20, 40], html: pinMarkup('#1769ff', label, String(count))})
}

function clusterIcon(cluster: { getChildCount(): number }, areas = false) {
  const count = cluster.getChildCount()
  const label = `${count} ${areas ? 'parking areas' : 'mapped parking spots'} · zoom in for details`
  // A cluster is a navigation control, not a status. It uses the same blue
  // parking pin language and always opens into its individual locations.
  return L.divIcon({className: '', iconSize: [40, 48], iconAnchor: [20, 40], html: pinMarkup('#1769ff', label, String(count))})
}

/** Clusters are a visual-performance aid only. Tapping one must always move
 * into its actual points, never leave a driver with an inert count badge. */
function openCluster(event: { layer?: { zoomToBounds?: () => void } }) {
  event.layer?.zoomToBounds?.()
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
    if (view.zoom >= 17) return visible.map(spot => ({lat: spot.lat, lng: spot.lng, spot, count: 1}))
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
    eventHandlers={{click: () => marker.spot ? onSelectSpot?.(marker.spot) : map.flyTo([marker.lat, marker.lng], Math.min(18, view.zoom + 2))}} />)}</>
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

/** Keep off-street facilities above dense bay clusters. They are a separate
 * destination type and must remain tappable even in a busy CBD. */
function ParkingPanes() {
  const map = useMap()
  useEffect(() => {
    const ensurePane = (name: string, zIndex: number) => {
      const pane = map.getPane(name) ?? map.createPane(name)
      pane.style.zIndex = String(zIndex)
    }
    ensurePane('bay-marker-pane', 610)
    ensurePane('bay-cluster-pane', 620)
    ensurePane('area-marker-pane', 640)
    ensurePane('area-cluster-pane', 645)
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

/** Reports only meaningful zoom changes. This lets the search layer fetch
 * nearby areas as someone zooms out, without reloading on every map pan. */
function CoverageZoom({ onChange }: { onChange?: (zoom: number) => void }) {
  const map = useMap()
  useMapEvents({ zoomend: () => onChange?.(map.getZoom()) })
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
  onSelectCarPark,
  onZoomChange,
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
   * square "P" markers that open an area sheet rather than a bay
   * detail sheet, since they carry capacity rather than legal rules. */
  carParks?: CarPark[]
  onSelectCarPark?: (area: CarPark) => void
  onZoomChange?: (zoom: number) => void
}) {
  const mePosition = myLocation ?? center
  const meterSpots = spots.filter(spot => spot.catalog?.source_name === 'SFMTA meter inventory')
  const otherSpots = spots.filter(spot => spot.catalog?.source_name !== 'SFMTA meter inventory')
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={Math.min(zoom, 18)} maxZoom={19} className="h-full w-full" zoomControl={false} scrollWheelZoom doubleClickZoom dragging touchZoom rotate touchRotate rotateControl={false}>
      <ResizeMap />
      <ParkingPanes />
      <MapOrientation />
      <CoverageZoom onChange={onZoomChange} />
      <ZoomControl position="bottomleft" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={18}
        maxZoom={19}
        updateWhenZooming={false}
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
      <MarkerClusterGroup iconCreateFunction={(cluster: {getChildCount():number})=>clusterIcon(cluster)} clusterPane="bay-cluster-pane" eventHandlers={{ clusterclick: openCluster }} chunkedLoading maxClusterRadius={42} disableClusteringAtZoom={17} zoomToBoundsOnClick spiderfyOnMaxZoom>
        {otherSpots.map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat, spot.lng]}
            pane="bay-marker-pane"
            icon={pinIcon(availability(spot).color, availability(spot).state)}
            eventHandlers={{ click: () => onSelectSpot?.(spot) }}
          />
        ))}
      </MarkerClusterGroup>
      {carParks.filter(area => area.boundary?.length).map(area => <Polygon key={`boundary:${area.id}`} positions={area.boundary!} pathOptions={{color:'#1769ff', weight:2, fillOpacity:.10}} eventHandlers={{ click: () => onSelectCarPark?.(area) }} />)}
      <MarkerClusterGroup iconCreateFunction={(cluster: {getChildCount():number})=>clusterIcon(cluster,true)} clusterPane="area-cluster-pane" eventHandlers={{ clusterclick: openCluster }} chunkedLoading maxClusterRadius={35} disableClusteringAtZoom={17} zoomToBoundsOnClick spiderfyOnMaxZoom>
      {carParks.map((cp) => (
        <Marker key={cp.id} position={[cp.lat, cp.lng]} pane="area-marker-pane" icon={carParkIcon()} eventHandlers={{ click: () => onSelectCarPark?.(cp) }} />
      ))}
      </MarkerClusterGroup>
      {pickMode && <ClickCatcher onPick={(lat, lng) => onPickLocation?.(lat, lng)} />}
      {pickedLocation && <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={pickIcon()} />}
    </MapContainer>
  )
}
