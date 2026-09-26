import {afterEach,describe,it,expect,vi} from 'vitest'
import {searchCities} from './geocoding'
afterEach(()=>vi.unstubAllGlobals())
describe('fast supported city search',()=>{
 it('does not wait for a failed network to select Melbourne',async()=>{
  const fetch=vi.fn(()=>new Promise(()=>{}));vi.stubGlobal('fetch',fetch)
  expect((await searchCities('Melbourne','AU','Victoria'))[0]).toMatchObject({name:'Melbourne',lat:-37.8136})
  expect(fetch).not.toHaveBeenCalled()
 })
 it('recognises Bangalore and keeps state boundaries',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false}))
  expect((await searchCities('Bangalore','IN','Karnataka'))[0]?.name).toBe('Bengaluru')
  expect(await searchCities('Chennai','IN','Karnataka')).toEqual([])
 })
})
