import type { Listing } from '../types'
import { formatMoney } from '../lib/listingAvailability'

function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(1)} km`
}

export function ListingCard({ listing, onClick }: { listing: Listing; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-slate-900">{listing.address_text}</p>
          <p className="text-sm text-slate-500">
            {listing.country ? `${listing.country} · ` : ''}
            {formatDistance(listing.distance_m)}
          </p>
        </div>
      </div>
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-800">
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
        {formatMoney(listing.currency, listing.price_per_hour)}/hr · Book
      </div>
    </button>
  )
}
