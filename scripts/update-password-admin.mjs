import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]
const newPassword = process.argv[3]

if (!email || !newPassword) {
  console.error('Uso: node scripts/update-password-admin.mjs <email> <nova_senha>')
  process.exit(1)
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!url || !serviceKey) {
  console.error('Configure SUPABASE_URL/VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

;(async () => {
  const { data: prof, error: profErr } = await supabase
    .from('profiles')
    .select('user_id, email')
    .eq('email', email)
    .maybeSingle()

  if (profErr) {
    console.error('Erro ao consultar perfil:', profErr.message)
    process.exit(1)
  }
  if (!prof || !prof.user_id) {
    console.error('Usuário não encontrado em profiles para', email)
    process.exit(1)
  }

  const { error: updErr } = await supabase.auth.admin.updateUserById(prof.user_id, { password: newPassword })
  if (updErr) {
    console.error('Erro ao atualizar senha:', updErr.message)
    process.exit(1)
  }
  console.log('Senha atualizada via Admin para', email)
  process.exit(0)
})()

