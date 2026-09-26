import { afterEach,describe,it,expect,vi } from 'vitest'
const mocks=vi.hoisted(()=>({native:vi.fn(),check:vi.fn(),request:vi.fn(),get:vi.fn(),watch:vi.fn(),clear:vi.fn()}))
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:mocks.native}}))
vi.mock('@capacitor/geolocation',()=>({Geolocation:{checkPermissions:mocks.check,requestPermissions:mocks.request,getCurrentPosition:mocks.get,watchPosition:mocks.watch,clearWatch:mocks.clear}}))
import {getBrowserLocation,watchLocation} from './geolocation'
afterEach(()=>{vi.resetAllMocks();vi.unstubAllGlobals()})
describe('responsive location detection',()=>{
 it('accepts coarse native permission without repeating the prompt',async()=>{
  mocks.native.mockReturnValue(true);mocks.check.mockResolvedValue({location:'denied',coarseLocation:'granted'});mocks.get.mockResolvedValue({coords:{latitude:13,longitude:80,accuracy:400}})
  expect((await getBrowserLocation()).coords.accuracy).toBe(400)
  expect(mocks.request).not.toHaveBeenCalled();expect(mocks.get).toHaveBeenCalledWith({enableHighAccuracy:false,timeout:5000,maximumAge:15000})
 })
 it('returns cached browser fixes quickly with their accuracy',async()=>{
  mocks.native.mockReturnValue(false)
  const getCurrentPosition=vi.fn((success:(p:object)=>void,_error:unknown,_options:unknown)=>success({coords:{latitude:13,longitude:80,accuracy:20}}));vi.stubGlobal('navigator',{geolocation:{getCurrentPosition}})
  expect((await getBrowserLocation()).coords.accuracy).toBe(20)
  expect(getCurrentPosition.mock.calls[0][2]).toMatchObject({enableHighAccuracy:false,timeout:5000,maximumAge:15000})
 })
 it('distinguishes a permission denial',async()=>{
  mocks.native.mockReturnValue(false);vi.stubGlobal('navigator',{geolocation:{getCurrentPosition:(_s:unknown,e:(x:object)=>void)=>e({code:1,PERMISSION_DENIED:1,TIMEOUT:3,message:'denied'})}})
  await expect(getBrowserLocation()).rejects.toMatchObject({reason:'permission_denied'})
 })
 it('stops a native watch that resolves after unmount',async()=>{
  mocks.native.mockReturnValue(true);let resolve!:(id:string)=>void;mocks.watch.mockReturnValue(new Promise(r=>{resolve=r}));mocks.clear.mockResolvedValue(undefined)
  const update=vi.fn();const stop=watchLocation(update);stop();mocks.watch.mock.calls[0][1]({coords:{latitude:0,longitude:0}},null);resolve('native-watch');await Promise.resolve();await Promise.resolve()
  expect(mocks.clear).toHaveBeenCalledWith({id:'native-watch'})
  expect(update).not.toHaveBeenCalled()
 })
 it('handles unavailable browser GPS',async()=>{
  mocks.native.mockReturnValue(false);vi.stubGlobal('navigator',{})
  await expect(getBrowserLocation()).rejects.toMatchObject({reason:'unsupported'})
 })
})
