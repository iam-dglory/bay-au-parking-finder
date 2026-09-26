import { describe,it,expect } from 'vitest'
import { mergeMelbourneSensors } from './melbourneSensors'
import type { CouncilSensor } from './melbourneSensors'
import type { ParkingSpot } from '../types'
const center={lat:-37.81,lng:144.95}, stamp='2026-09-26T03:00:00Z'
const bay=(id:string,kerbside_id:string|null,offset=0):ParkingSpot=>({id,kerbside_id,...center,lat:center.lat+offset,address_text:id,suburb:null,state:'VIC',country:'AU',distance_m:0,created_by:'council',photo_url:null,moderation_status:'approved',rules:[],latest_ping:null,sensor_status:null})
const reading=(kerbsideid=42):CouncilSensor=>({kerbsideid,status_description:'Unoccupied',status_timestamp:stamp,lastupdated:stamp,location:{lat:center.lat,lon:center.lng}})
describe('Melbourne council ID reconciliation',()=>{
 it('adds official missing sensor points without copying the closest bays rules',()=>{
  const rows=mergeMelbourneSensors([bay('near','43')],[reading()],center,stamp)
  expect(rows.find(r=>r.id==='near')?.sensor_status).toBeNull()
  expect(rows.find(r=>r.kerbside_id==='42')).toMatchObject({id:'council-sensor:42',rules:[],sensor_status:{match_method:'kerbside_id',sensor_kerbside_id:'42'}})
 })
 it('rejects a spatially displaced exact ID and uses the official sensor location separately',()=>{
  const rows=mergeMelbourneSensors([bay('bad','42',.01)],[reading()],center,stamp)
  expect(rows.find(r=>r.id==='bad')).toBeUndefined()
  expect(rows.find(r=>r.id==='council-sensor:42')?.lat).toBe(center.lat)
 })
 it('colours only the closest bay when the stored ID is duplicated',()=>{
  const rows=mergeMelbourneSensors([bay('a','42',.00003),bay('b','42')],[reading()],center,stamp)
  expect(rows.find(r=>r.id==='a')).toBeUndefined()
  expect(rows.find(r=>r.id==='b')?.sensor_status?.status).toBe('unoccupied')
  expect(rows).toHaveLength(1)
 })
 it('uses the latest update if the council repeats an ID',()=>{
  const older={...reading(),lastupdated:'2026-09-26T02:00:00Z',status_description:'Present'}
  expect(mergeMelbourneSensors([bay('a','42')],[reading(),older],center,stamp)[0].sensor_status?.status).toBe('unoccupied')
 })
 it('does not interpret another status as occupied or vacant',()=>expect(mergeMelbourneSensors([],[{...reading(),status_description:'Offline'}],center,stamp)[0].sensor_status).toBeNull())
 it('rejects malformed source coordinates and timestamps',()=>expect(mergeMelbourneSensors([],[{...reading(),lastupdated:'bad'},{...reading(43),location:{lat:0,lon:0}}],center,stamp)).toEqual([]))
})
