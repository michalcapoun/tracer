import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const MAPY_API_KEY = Deno.env.get('MAPY_API_KEY')
const CORS_ORIGIN = Deno.env.get('FRONTEND_URL') ?? '*'

const corsHeaders = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const { waypoints } = await req.json() as {
    waypoints: Array<{ lat: number; lng: number; name: string }>
  }

  if (!waypoints || waypoints.length < 2) {
    return new Response(
      JSON.stringify({ error: 'At least 2 waypoints required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  const routepoints = waypoints.map((w) => `${w.lng},${w.lat}`).join(';')

  const url = new URL('https://api.mapy.cz/v1/routing/route')
  url.searchParams.set('apikey', MAPY_API_KEY!)
  url.searchParams.set('routepoints', routepoints)
  url.searchParams.set('routeType', 'foot_fast')
  url.searchParams.set('lang', 'cs')

  const response = await fetch(url.toString())
  const data = await response.json()

  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
