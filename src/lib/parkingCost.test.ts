import { describe, expect, it } from 'vitest'
import carParkData from '../../public/data/melbourne/car-park-rates.json'
import { carParkCost, formatCents, melbourneStart, streetCost, streetCostRange, type CarParkRates, type WeekSchedule } from './parkingCost'

const everyDay = (windows: [number, number, number, number][]): WeekSchedule => Array.from({ length: 7 }, () => windows)
// Queen St (La Trobe–A'Beckett): $5.50/hr, 2P, 7:30am–8:30pm every day.
const queenSt = everyDay([[450, 1230, 550, 120]])
const tuesday = (h: number, m = 0) => ({ day: 2, minute: h * 60 + m })

describe('streetCost', () => {
  it('charges the hourly rate for a stay inside paid hours', () => {
    const r = streetCost(queenSt, tuesday(10), 120)
    expect(r.cents).toBe(1100)
    expect(r.limitAfterMinutes).toBeNull()
    expect(r.maxStayMinutes).toBe(120)
  })
  it('flags staying longer than the 2P limit', () => {
    expect(streetCost(queenSt, tuesday(10), 180).limitAfterMinutes).toBe(120)
  })
  it('stops charging when paid hours end and lifts the limit with them', () => {
    const r = streetCost(queenSt, tuesday(19, 30), 180) // 7:30pm for 3h; paid until 8:30pm
    expect(r.cents).toBe(550)
    expect(r.limitAfterMinutes).toBeNull()
    expect(r.segments).toEqual([{ fromMinute: 0, toMinute: 60, centsPerHour: 550 }])
  })
  it('is free overnight and starts the limit when paid hours begin', () => {
    const r = streetCost(queenSt, tuesday(6), 180) // 6am: free until 7:30
    expect(r.cents).toBe(825)
    expect(r.maxStayMinutes).toBe(90 + 120)
  })
  it('handles a rate change part-way through', () => {
    const s = everyDay([[450, 1080, 550, 240], [1080, 1230, 320, 240]])
    expect(streetCost(s, tuesday(17), 120).cents).toBe(550 + 320)
  })
})

describe('streetCostRange', () => {
  it('reports the range and the strictest limit when a street has two zones', () => {
    const r = streetCostRange([queenSt, everyDay([[450, 1110, 320, 240]])], tuesday(10), 60)
    expect([r.minCents, r.maxCents, r.maxStayMinutes, r.exact]).toEqual([320, 550, 120, false])
  })
})

const wilson: CarParkRates = {
  casual: [{ upToMinutes: 30, cents: 1000 }, { upToMinutes: 60, cents: 2000 }, { upToMinutes: 120, cents: 3500 }, { upToMinutes: 180, cents: 4500 }],
  dailyMaxCents: 6500,
  flat: [
    { name: 'Early bird', days: [1, 2, 3, 4, 5], enterFrom: 390, enterTo: 570, exitAfter: 900, exitBy: 1140, cents: 2500 },
    { name: 'Night', days: [0, 1, 2, 3, 4, 5, 6], enterFrom: 1020, enterTo: 1439, exitBy: 360, cents: 1500 },
  ],
}

describe('carParkCost', () => {
  it('uses the casual tier for a short stay', () => {
    expect(carParkCost(wilson, tuesday(11), 90)).toEqual({ cents: 3500, rateName: 'Hourly' })
  })
  it('caps at the daily maximum', () => {
    expect(carParkCost(wilson, tuesday(11), 300)).toEqual({ cents: 6500, rateName: 'Day rate' })
  })
  it('picks early bird when it applies and is cheaper', () => {
    expect(carParkCost(wilson, tuesday(8), 8 * 60)).toEqual({ cents: 2500, rateName: 'Early bird' })
  })
  it('does not give early bird if you leave before 3pm', () => {
    expect(carParkCost(wilson, tuesday(8), 120)?.rateName).toBe('Hourly')
  })
  it('applies a night rate that ends the next morning', () => {
    expect(carParkCost(wilson, tuesday(19), 5 * 60)).toEqual({ cents: 1500, rateName: 'Night' })
  })
})

describe('car park data file', () => {
  it('prices every listed car park for a weekday and has a dated source', () => {
    for (const park of carParkData.car_parks as { id: string; source_url: string; checked: string; rates: CarParkRates }[]) {
      expect(park.source_url).toMatch(/^https:\/\//)
      expect(park.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      const weekdayMorning = carParkCost(park.rates, tuesday(10), 120) ?? carParkCost(park.rates, { day: 5, minute: 600 }, 120)
      expect(weekdayMorning, park.id).not.toBeNull()
    }
  })
  it('does not offer hourly rates on days the operator does not publish them', () => {
    const fridayOnly: CarParkRates = { casual: [{ upToMinutes: 60, cents: 2500 }], casualDays: [5] }
    expect(carParkCost(fridayOnly, tuesday(10), 60)).toBeNull()
  })
})

describe('helpers', () => {
  it('reads Melbourne wall-clock time regardless of device zone', () => {
    expect(melbourneStart(new Date('2026-11-03T23:30:00Z'))).toEqual({ day: 3, minute: 10 * 60 + 30 })
  })
  it('formats money', () => {
    expect([formatCents(1100), formatCents(825)]).toEqual(['$11', '$8.25'])
  })
})
