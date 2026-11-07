/** Event mode: one tap sets the destination and a typical stay length.
 * Durations are typical event lengths including getting in and out. No
 * fixture data is used, so nothing here claims an event is on. */
export interface Venue { id: string; name: string; lat: number; lng: number; minutes: number; note?: string }

export const VENUES: Venue[] = [
  { id: 'mcg', name: 'MCG', lat: -37.8200, lng: 144.9834, minutes: 240, note: 'Event-day rates at nearby car parks may differ from the listed price.' },
  { id: 'marvel', name: 'Marvel Stadium', lat: -37.8165, lng: 144.9476, minutes: 240, note: 'Event-day rates at nearby car parks may differ from the listed price.' },
  { id: 'rod-laver', name: 'Rod Laver Arena', lat: -37.8216, lng: 144.9785, minutes: 240, note: 'Event-day rates at nearby car parks may differ from the listed price.' },
  { id: 'aami', name: 'AAMI Park', lat: -37.8251, lng: 144.9837, minutes: 180, note: 'Event-day rates at nearby car parks may differ from the listed price.' },
  { id: 'arts-centre', name: 'Arts Centre', lat: -37.8209, lng: 144.9686, minutes: 180 },
  { id: 'qvm', name: 'Queen Vic Market', lat: -37.8076, lng: 144.9568, minutes: 120 },
]
