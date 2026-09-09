"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { checkRateLimit, recordAttempt } from "@/app/lib/rate-limit"
import { RATE_LIMIT_CONFIGS } from "@/app/lib/rate-limit-config"

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const mode = formData.get('mode') as string
  const name = formData.get('name') as string

  const supabase = await createClient()

  if (mode === 'register') {
    // Registrar nova conta
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    })

    if (error) {
      await recordAttempt(RATE_LIMIT_CONFIGS.LOGIN, email, false, error.message)
      return redirect(`/login?mode=register&message=${encodeURIComponent('Não foi possível criar a conta. Verifique os dados e tente novamente.')}`)
    }

    await recordAttempt(RATE_LIMIT_CONFIGS.LOGIN, email, true)
    return redirect('/login?message=Conta criada com sucesso! Você já pode fazer login.')
  } else {
    // Login existente - verificar rate limit
    const rateLimitCheck = await checkRateLimit(RATE_LIMIT_CONFIGS.LOGIN, email)

    if (!rateLimitCheck.allowed) {
      await recordAttempt(RATE_LIMIT_CONFIGS.LOGIN, email, false, 'Rate limit excedido')
      return redirect(`/login?message=${encodeURIComponent('Muitas tentativas de login falhadas. Tente novamente em 15 minutos.')}`)
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Registrar tentativa falhada
      await recordAttempt(RATE_LIMIT_CONFIGS.LOGIN, email, false, error.message)
      const remaining = rateLimitCheck.remaining - 1
      return redirect(`/login?message=${encodeURIComponent(`Credenciais inválidas. ${remaining} tentativa(s) restante(s).`)}`)
    }

    // Sucesso
    await recordAttempt(RATE_LIMIT_CONFIGS.LOGIN, email, true)
    return redirect('/')
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
