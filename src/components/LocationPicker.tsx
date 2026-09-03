import { AU_CITIES } from '../lib/cities'

export function LocationPicker({ onPick, onUseGps }: { onPick: (lat: number, lng: number, label: string) => void; onUseGps: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Where are you parking?</h2>
        <p className="mt-1 text-sm text-slate-500">Share your location, or pick a city to browse.</p>
      </div>
      <button onClick={onUseGps} className="w-full max-w-xs rounded-xl bg-slate-900 py-3 font-medium text-white hover:bg-slate-800">
        Use my location
      </button>
      <div className="grid w-full max-w-xs grid-cols-2 gap-2">
        {AU_CITIES.map((city) => (
          <button
            key={city.name}
            onClick={() => onPick(city.lat, city.lng, city.name)}
            className="rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          >
            {city.name}
          </button>
        ))}
      </div>
    </div>
  )
}
