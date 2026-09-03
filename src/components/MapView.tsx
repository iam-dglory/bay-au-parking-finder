import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import type { ParkingSpot, SpotStatus } from '../types'
import { STATUS_COLORS } from '../lib/statusColors'

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

function meIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
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

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [center[0], center[1]])
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
}: {
  center: { lat: number; lng: number }
  spots: (ParkingSpot & { status: SpotStatus })[]
  onSelectSpot?: (spot: ParkingSpot & { status: SpotStatus }) => void
  pickMode?: boolean
  pickedLocation?: { lat: number; lng: number } | null
  onPickLocation?: (lat: number, lng: number) => void
}) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={15} className="h-full w-full" zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter center={[center.lat, center.lng]} />
      <Marker position={[center.lat, center.lng]} icon={meIcon()} />
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={pinIcon(STATUS_COLORS[spot.status.status].hex)}
          eventHandlers={{ click: () => onSelectSpot?.(spot) }}
        />
      ))}
      {pickMode && <ClickCatcher onPick={(lat, lng) => onPickLocation?.(lat, lng)} />}
      {pickedLocation && <Marker position={[pickedLocation.lat, pickedLocation.lng]} icon={pickIcon()} />}
    </MapContainer>
  )
}
