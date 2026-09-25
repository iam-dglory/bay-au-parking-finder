import type { CarPark } from '../types'

export function ParkingAreaDetails({ area, compact=false }: { area: CarPark; compact?: boolean }) {
  const access=area.access==='customers' ? 'Customers only' : area.access==='permissive' ? 'Access at operator’s discretion' : area.access==='yes' ? 'Public access listed' : 'Entry conditions apply'
  return <div className="space-y-2 text-sm text-slate-700">
    <h3 className="font-bold text-slate-950">{area.address_text}</h3>
    <a className="inline-block rounded-xl bg-blue-600 px-4 py-2 font-semibold !text-white" href={`https://www.google.com/maps/dir/?api=1&destination=${area.lat},${area.lng}`} target="_blank" rel="noreferrer">Get directions</a>
    <p className="text-xs">{Math.round(area.distance_m)} m away{area.capacity ? ` · ${area.capacity} total spaces` : ''} · Availability on arrival</p>
    {area.source_name && <p className="text-xs">{access} · {area.vehicle_types}</p>}
    {area.occupancy_snapshot && <div className="rounded-xl bg-emerald-50 p-3 text-xs"><p className="font-bold text-emerald-900">Operator availability snapshot</p>{Object.entries(area.occupancy_snapshot.vehicles).filter(([,v])=>v.capacity>0).map(([vehicle,v])=><p key={vehicle}>{vehicle}: <b>{v.available} available</b> of {v.capacity}</p>)}<p className="mt-1 text-emerald-800">Fetched {new Date(area.occupancy_snapshot.fetched_at).toLocaleString()}. The source does not publish an observation timestamp; availability can change before arrival.</p><a className="text-emerald-900 underline" target="_blank" rel="noreferrer" href={area.occupancy_snapshot.source_url}>Chennai Metro availability</a></div>}
    {area.tariffs?.length ? <details open={!compact}>
      <summary className="cursor-pointer font-semibold text-blue-700">Prices by vehicle & duration</summary>
      <table className="mt-2 w-full text-left text-xs"><caption className="sr-only">Published parking prices in Indian rupees</caption><thead><tr><th>Vehicle</th><th>Duration</th><th className="text-right">Price</th></tr></thead><tbody>{area.tariffs.map((row,i)=><tr key={i} className="border-t border-slate-100"><td className="py-1 pr-2">{row.vehicle}</td><td className="pr-2">{row.period}</td><td className="text-right">₹{row.amount}</td></tr>)}</tbody></table>
      <p className="mt-2 text-xs text-slate-500">{area.pricing_notes}</p>
      <a href={area.pricing_source_url!} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">Operator tariff · checked {area.pricing_checked_at}</a>
    </details> : area.hourly_rate_min != null ? <p className="font-semibold">{area.currency ?? 'AUD'} {area.hourly_rate_min.toFixed(2)}{area.hourly_rate_max && area.hourly_rate_max!==area.hourly_rate_min ? `–${area.hourly_rate_max.toFixed(2)}` : ''}/hour</p> : <p className="text-xs">{area.fee==='no' ? 'Mapped as no fee; current terms at entrance.' : area.fee==='yes' ? 'Paid parking · published price unavailable' : 'Price not published'}</p>}
    <details className="text-xs text-slate-500"><summary className="cursor-pointer">Location & source</summary>
      {area.source_name ? <p className="mt-1"><a className="text-blue-700 underline" target="_blank" rel="noreferrer" href={area.source_url}>{area.source_name} © contributors</a> · map edited {area.source_updated_at?.slice(0,10)} · retrieved {area.collected_at}. {area.location_note}. Map edit dates are not a site inspection.</p> : <p>City of Melbourne {area.census_year} census. Capacity is the total number of spaces, not live vacancy.</p>}
      {area.opening_hours && <p>Source opening hours: {area.opening_hours}</p>}
    </details>
  </div>
}
