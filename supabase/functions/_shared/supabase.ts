import { createClient } from 'npm:@supabase/supabase-js@2.112.1'

function required(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing server configuration: ${name}`)
  return value
}

export function serviceClient() {
  return createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function authenticatedUser(request: Request) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) throw new Error('Authentication required')
  const token = authorization.slice('Bearer '.length)
  const client = serviceClient()
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user || data.user.is_anonymous) throw new Error('A verified account is required')
  return { user: data.user, service: client }
}

