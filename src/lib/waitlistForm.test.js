import { describe, expect, it } from 'vitest'
import { signupPayload } from '../../public/waitlist-form.js'
describe('waitlist field mapping',()=>{
  it('stores exactly the three requested answers plus form metadata',()=>{
    expect(signupPayload(' Hello@Example.COM ','android','AU')).toEqual({email:'hello@example.com',device:'android',country_code:'AU',form_version:3,consent_version:'2026-09-29'})
  })
  it('requires email, device, and one of the three supported countries',()=>{
    expect(()=>signupPayload('not-an-email','android','AU')).toThrow()
    expect(()=>signupPayload('a@b.com','','AU')).toThrow()
    expect(()=>signupPayload('a@b.com','iphone','')).toThrow()
    expect(()=>signupPayload('a@b.com','iphone','GB')).toThrow()
    expect(signupPayload('a@b.com','iphone','IN').country_code).toBe('IN')
    expect(signupPayload('a@b.com','iphone','US').country_code).toBe('US')
  })
})
