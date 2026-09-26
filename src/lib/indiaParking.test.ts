import { describe, expect, it } from 'vitest'
import { isIndiaSearch, nearbyCatalog } from './indiaParking'
import type { CarPark } from '../types'

const row=(id:string,lat:number,lng:number):CarPark=>({id,address_text:id,suburb:null,lat,lng,distance_m:0,capacity:null,census_year:null})
describe('India parking catalog',()=>{
  it('recognises Indian coordinates without treating Melbourne as India',()=>{
    expect(isIndiaSearch(13.0827,80.2707)).toBe(true)
    expect(isIndiaSearch(-37.8136,144.9631)).toBe(false)
  })
  it('calculates distance, applies radius, and orders nearest first',()=>{
    const rows=nearbyCatalog([row('far',13.09,80.27),row('near',13.0828,80.2708)],13.0827,80.2707,1000)
    expect(rows.map(r=>r.id)).toEqual(['near','far'])
    expect(rows[0].distance_m).toBeGreaterThan(0)
  })
  it('shows an off-street facility once while retaining standalone street bays',()=>{
    const area={...row('market',-37.8083,144.9567),kind:'area' as const}
    const child={...row('inside-space',-37.8084,144.9568),kind:'bay' as const,parent_area_id:area.id}
    const street={...row('queen-street',-37.8083,144.958),kind:'bay' as const}
    const rows=nearbyCatalog([child,area,street],area.lat,area.lng,1000)
    expect(rows.map(r=>r.id)).toEqual(['market','queen-street'])
    expect(child.parent_area_id).toBe('market')
  })
})
