export function signupPayload(email, device, melbourne) {
  email=email.trim().toLowerCase()
  if(email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  if(!['android','iphone'].includes(device)) throw new Error('Choose Android or iPhone.')
  if(!['yes','no'].includes(melbourne)) throw new Error('Choose whether you drive in Melbourne.')
  return {email,device,drives_in_melbourne:melbourne==='yes',form_version:2,consent_version:'2026-09-25'}
}
export const WAITLIST_URL='https://iam-dglory.github.io/bay-au-parking-finder/waitlist.html'

if(typeof document!=='undefined') {
  const form=document.querySelector('#waitlistForm')
  form?.addEventListener('submit',async event=>{
    event.preventDefault()
    const error=document.querySelector('#formError'), button=form.querySelector('button[type=submit]')
    error.textContent=''
    try {
      const data=new FormData(form)
      const payload=signupPayload(data.get('email'),data.get('device'),data.get('melbourne'))
      button.disabled=true;button.textContent='Saving your spot…'
      const response=await fetch('https://ezwiagssiuvmhayvsmbk.supabase.co/rest/v1/waitlist_signups',{
        method:'POST',headers:{'Content-Type':'application/json',apikey:'sb_publishable_5Swgqoy2CDhhz1URX9zzPA_Xv1m_Wah',Prefer:'return=minimal'},body:JSON.stringify(payload),
      })
      if(!response.ok) {
        const body=await response.json().catch(()=>({}))
        if(response.status!==409 || body.code!=='23505')throw new Error('Couldn’t save your spot just yet. Please try again.')
      }
      form.hidden=true;document.querySelector('#signupIntro').hidden=true
      const success=document.querySelector('#success');success.hidden=false;success.focus()
    } catch(err) {error.textContent=err.message;button.disabled=false;button.textContent='Join Bay →'}
  })
  document.querySelector('#copyLink')?.addEventListener('click',async()=>{
    try {await navigator.clipboard.writeText(WAITLIST_URL);document.querySelector('#shareStatus').textContent='Link copied. Send it to your favourite parking complainer.'}
    catch {document.querySelector('#shareStatus').textContent=`Copy this link: ${WAITLIST_URL}`}
  })
  document.querySelector('#shareLink')?.addEventListener('click',async()=>{
    try {
      if(navigator.share)await navigator.share({title:'Bay · Find parking. Faster.',text:'Your car deserves a spot. You deserve your time back. Join Bay’s Melbourne early access.',url:WAITLIST_URL})
      else document.querySelector('#shareStatus').textContent='Copy the link and paste it into an Instagram message or story.'
    } catch(err) {if(err.name!=='AbortError')document.querySelector('#shareStatus').textContent='Copy the link to share Bay.'}
  })
}
