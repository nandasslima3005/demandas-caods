import { createClient } from '@supabase/supabase-js'

const email = process.argv[2]
const oldPassword = process.argv[3]
const newPassword = process.argv[4]

if (!email || !oldPassword || !newPassword) {
  console.error('Uso: node scripts/update-password-user.mjs <email> <senha_atual> <nova_senha>')
  process.exit(1)
}

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !anonKey) {
  console.error('Configure SUPABASE_URL/VITE_SUPABASE_URL e SUPABASE_ANON_KEY/VITE_SUPABASE_PUBLISHABLE_KEY no ambiente/.env')
  process.exit(1)
}

const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })

;(async () => {
  const { error: signError } = await supabase.auth.signInWithPassword({ email, password: oldPassword })
  if (signError) {
    console.error('Falha ao autenticar:', signError.message)
    process.exit(1)
  }
  const { error: updError } = await supabase.auth.updateUser({ password: newPassword })
  if (updError) {
    console.error('Erro ao alterar senha:', updError.message)
    process.exit(1)
  }
  console.log('Senha alterada com sucesso para', email)
  process.exit(0)
})()

