import type { CarPark } from '../types'
import { formatMoney } from '../lib/money'

export function ParkingAreaDetails({ area, compact=false }: { area: CarPark; compact?: boolean }) {
  const access=area.access==='customers' ? 'Customers only' : area.access==='permissive' ? 'Access at operator’s discretion' : area.access==='yes' ? 'Public access listed' : 'Entry conditions apply'
  return <div className="space-y-2 text-sm text-slate-700">
    <h3 className="font-bold text-slate-950">{area.address_text}</h3>
    {area.facility_type && <p className="font-semibold text-blue-700">{area.facility_type} · Paid parking</p>}
    <a className="inline-block rounded-xl bg-blue-600 px-4 py-2 font-semibold !text-white" href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(area.directions_query ?? `${area.lat},${area.lng}`)}`} target="_blank" rel="noreferrer">Get directions</a>
    {area.entrance_summary && <p className="text-xs font-medium">{area.entrance_summary}</p>}
    {area.opening_hours_summary && <p className="text-xs">{area.opening_hours_summary}</p>}
    <p className="text-xs">{Math.round(area.distance_m)} m away{area.capacity ? ` · ${area.capacity} total spaces` : ''} · Availability on arrival</p>
    {area.source_name && <p className="text-xs">{access} · {area.vehicle_types}</p>}
    {area.vehicle_capacity && <p className="text-xs text-slate-500">Station capacity: {Object.entries(area.vehicle_capacity).filter(([,count])=>count>0).map(([vehicle,count])=>`${vehicle}: ${count}`).join(' · ')} (total, not vacancies)</p>}
    {area.price_summary && <p className="rounded-xl bg-blue-50 px-3 py-2 font-semibold text-blue-900">{area.price_summary}</p>}
    {area.price_summary_conditions && <p className="text-xs text-slate-600">{area.price_summary_conditions}</p>}
    {area.occupancy_snapshot && <details className="rounded-xl bg-slate-50 p-3 text-xs"><summary className="cursor-pointer font-semibold text-slate-700">Dated operator availability snapshot</summary>{Object.entries(area.occupancy_snapshot.vehicles).filter(([,v])=>v.capacity>0).map(([vehicle,v])=><p key={vehicle}>{vehicle}: <b>{v.available} reported available in this snapshot</b> of {v.capacity}</p>)}<p className="mt-1 text-emerald-800">Fetched {new Date(area.occupancy_snapshot.fetched_at).toLocaleString()}. The source does not publish an observation timestamp; availability can change before arrival.</p><a className="text-emerald-900 underline" target="_blank" rel="noreferrer" href={area.occupancy_snapshot.source_url}>Chennai Metro availability</a></details>}
    {area.tariffs?.length ? <details open={compact ? false : undefined}>
      <summary className="cursor-pointer font-semibold text-blue-700">Prices by vehicle & duration</summary>
      <table className="mt-2 w-full text-left text-xs"><caption className="sr-only">Published parking prices in {area.currency ?? 'AUD'}</caption><thead><tr><th>Vehicle</th><th>Duration</th><th className="text-right">Price</th></tr></thead><tbody>{area.tariffs.map((row,i)=><tr key={i} className="border-t border-slate-100"><td className="py-1 pr-2">{row.vehicle}</td><td className="pr-2">{row.category && <b>{row.category} · </b>}{row.period}{row.conditions && <p className="mt-1 text-[11px] text-slate-500">{row.conditions}</p>}</td><td className="text-right">{formatMoney(area.currency ?? 'AUD', row.amount)}</td></tr>)}</tbody></table>
      <p className="mt-2 text-xs text-slate-500">{area.pricing_notes}</p>
      <a href={area.pricing_source_url!} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">Operator tariff · checked {area.pricing_checked_at}</a>
    </details> : area.hourly_rate_min != null ? <p className="font-semibold">{area.currency ?? 'AUD'} {area.hourly_rate_min.toFixed(2)}{area.hourly_rate_max && area.hourly_rate_max!==area.hourly_rate_min ? `–${area.hourly_rate_max.toFixed(2)}` : ''}/hour</p> : <p className="text-xs">{area.fee==='no' ? 'Mapped as no fee; current terms at entrance.' : area.fee==='yes' ? 'Paid parking · published price unavailable' : 'Price not published'}</p>}
    <details className="text-xs text-slate-500"><summary className="cursor-pointer">Location & source</summary>
      {area.source_name ? <p className="mt-1"><a className="text-blue-700 underline" target="_blank" rel="noreferrer" href={area.source_url}>{area.source_name}{area.source_name === 'OpenStreetMap' ? ' © contributors' : ''}</a>{area.source_updated_at ? ` · source updated ${area.source_updated_at.slice(0,10)}` : ''} · retrieved {area.collected_at}. {area.location_note}. Source dates are not a site inspection.</p> : <p>City of Melbourne {area.census_year} census. Capacity is the total number of spaces, not live vacancy.</p>}
      {area.location_source_url && <a className="text-blue-700 underline" href={area.location_source_url} target="_blank" rel="noreferrer">Mapped location · OpenStreetMap © contributors</a>}
      {area.mapped_zone && <p>Mapped road layout describes a parking zone, not an individual signed bay. Confirm the side of the road and current signs.</p>}
      {area.source_terms && Object.entries(area.source_terms).filter(([key]) => /charge|maxstay|restriction/.test(key)).map(([key,value]) => <p key={key}>{key}: {value}</p>)}
      {area.opening_hours && <p>Source opening hours: {area.opening_hours}</p>}
    </details>
  </div>
}
