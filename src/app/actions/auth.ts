"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { checkRateLimit, recordAttempt } from "@/app/lib/rate-limit"
import { RATE_LIMIT_CONFIGS } from "@/app/lib/rate-limit-config"
import { loginSchema, registerSchema } from "@/app/actions/schema"

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const mode = formData.get('mode') as string
  const name = formData.get('name') as string

  const supabase = await createClient()

  if (mode === 'register') {
    // Validar entrada com Zod
    const validationResult = registerSchema.safeParse({ email, password, name })
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0].message
      return redirect(`/login?mode=register&message=${encodeURIComponent(errorMessage)}`)
    }

    // Registrar nova conta
    const { error } = await supabase.auth.signUp({
      email: validationResult.data.email,
      password: validationResult.data.password,
      options: { data: { full_name: validationResult.data.name } }
    })

    if (error) {
      await recordAttempt(RATE_LIMIT_CONFIGS.LOGIN, email, false, error.message)
      return redirect(`/login?mode=register&message=${encodeURIComponent('Não foi possível criar a conta. Verifique os dados e tente novamente.')}`)
    }

    await recordAttempt(RATE_LIMIT_CONFIGS.LOGIN, email, true)
    return redirect('/login?message=Conta criada com sucesso! Você já pode fazer login.')
  } else {
    // Validar entrada com Zod
    const validationResult = loginSchema.safeParse({ email, password })
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0].message
      return redirect(`/login?message=${encodeURIComponent(errorMessage)}`)
    }

    // Login existente - verificar rate limit
    const rateLimitCheck = await checkRateLimit(RATE_LIMIT_CONFIGS.LOGIN, validationResult.data.email)

    if (!rateLimitCheck.allowed) {
      await recordAttempt(RATE_LIMIT_CONFIGS.LOGIN, validationResult.data.email, false, 'Rate limit excedido')
      return redirect(`/login?message=${encodeURIComponent('Muitas tentativas de login falhadas. Tente novamente em 15 minutos.')}`)
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: validationResult.data.email,
      password: validationResult.data.password
    })

    if (error) {
      // Registrar tentativa falhada
      await recordAttempt(RATE_LIMIT_CONFIGS.LOGIN, validationResult.data.email, false, error.message)
      const remaining = rateLimitCheck.remaining - 1
      return redirect(`/login?message=${encodeURIComponent(`Credenciais inválidas. ${remaining} tentativa(s) restante(s).`)}`)
    }

    // Sucesso
    await recordAttempt(RATE_LIMIT_CONFIGS.LOGIN, validationResult.data.email, true)
    return redirect('/')
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
