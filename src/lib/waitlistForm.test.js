import { describe, expect, it } from 'vitest'
import { signupPayload } from '../../public/waitlist-form.js'
describe('waitlist field mapping',()=>{
  it('stores exactly the three requested answers plus form metadata',()=>{
    expect(signupPayload(' Hello@Example.COM ','android','yes')).toEqual({email:'hello@example.com',device:'android',drives_in_melbourne:true,form_version:2,consent_version:'2026-09-25'})
  })
  it('requires email, device, and Melbourne answer',()=>{
    expect(()=>signupPayload('not-an-email','android','yes')).toThrow()
    expect(()=>signupPayload('a@b.com','','yes')).toThrow()
    expect(()=>signupPayload('a@b.com','iphone','')).toThrow()
  })
})
