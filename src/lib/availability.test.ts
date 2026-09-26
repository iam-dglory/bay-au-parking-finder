import { describe,it,expect } from 'vitest'
import { availability } from './availability'
import type { ParkingSpot,SensorStatus } from '../types'
const now=new Date('2026-09-26T03:00:00Z')
const time=(minutes:number)=>new Date(now.getTime()-minutes*60000).toISOString()
const sensor:SensorStatus={status:'unoccupied',sensor_kerbside_id:'42',match_method:'kerbside_id',last_confirmed_at:time(1),synced_at:time(0),status_timestamp:time(1000)}
const spot:Pick<ParkingSpot,'kerbside_id'|'sensor_status'|'latest_ping'>={kerbside_id:'42',sensor_status:sensor,latest_ping:null}
describe('evidence required for live availability',()=>{
 it('accepts a freshly repeated unchanged state, not only a recent transition',()=>expect(availability(spot,now).state).toBe('vacant'))
 it('ignores a driver claiming free while the sensor reports occupied',()=>expect(availability({...spot,sensor_status:{...sensor,status:'present'},latest_ping:{status:'free',created_at:time(0),corroborating_count:10,photo_url:null}},now).state).toBe('occupied'))
 it('never presents a manual report as live vacancy',()=>expect(availability({...spot,sensor_status:null,latest_ping:{status:'free',created_at:time(0),corroborating_count:10,photo_url:null}},now).state).toBe('unknown'))
 it('rejects an adjacent bay identifier',()=>expect(availability({...spot,sensor_status:{...sensor,sensor_kerbside_id:'43'}},now).state).toBe('unknown'))
 it.each(['coordinate','unknown',undefined] as const)('rejects %s join provenance even with matching IDs',match_method=>expect(availability({...spot,sensor_status:{...sensor,match_method}},now).state).toBe('unknown'))
 it.each(['last_confirmed_at','synced_at'] as const)('expires a stale %s',key=>expect(availability({...spot,sensor_status:{...sensor,[key]:time(5.01)}},now).state).toBe('unknown'))
 it.each(['not-a-date',time(-1)])('rejects malformed/future source time %s',last_confirmed_at=>expect(availability({...spot,sensor_status:{...sensor,last_confirmed_at}},now).state).toBe('unknown'))
 it('does not use a question mark or a claim of vacancy without evidence',()=>expect(availability({...spot,sensor_status:null},now).label).toBe('Availability on arrival'))
})
