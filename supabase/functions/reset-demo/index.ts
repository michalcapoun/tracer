import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEMO_EMAIL = 'tracer@demo.cz'

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
  if (userError) {
    return new Response(JSON.stringify({ error: userError.message }), { status: 500 })
  }

  const demoUser = users.find((u) => u.email === DEMO_EMAIL)
  if (!demoUser) {
    return new Response(JSON.stringify({ error: 'Demo user not found' }), { status: 404 })
  }

  const { error: deleteError } = await supabase
    .from('trips')
    .delete()
    .eq('user_id', demoUser.id)

  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true, userId: demoUser.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
