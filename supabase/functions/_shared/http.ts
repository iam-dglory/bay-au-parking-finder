const configuredOrigins = (Deno.env.get('MARKETPLACE_ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') ?? ''
  const permitted = configuredOrigins.includes(origin) || (configuredOrigins.length === 0 && ['http://localhost', 'http://localhost:5173', 'capacitor://localhost'].includes(origin))
  return {
    'Access-Control-Allow-Origin': permitted ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

export function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(request), 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })
}

export function errorResponse(request: Request, error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : 'Request failed'
  return json(request, { error: message }, status)
}

export function requirePost(request: Request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) })
  if (request.method !== 'POST') throw new Error('Method not allowed')
  return null
}

