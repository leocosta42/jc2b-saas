"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export interface RateLimitConfig {
  action: string
  maxAttempts: number
  windowMinutes: number
  identifier?: 'email' | 'ip' // O que usar como identificador
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt?: Date
  error?: string
}

// In-memory store para cache rápido (evita queries ao BD a todo tempo)
const memoryStore = new Map<string, { count: number; resetAt: number }>()

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of memoryStore.entries()) {
    if (value.resetAt < now) {
      memoryStore.delete(key)
    }
  }
}, 60000) // A cada 1 minuto

export async function checkRateLimit(
  config: RateLimitConfig,
  userIdentifier: string
): Promise<RateLimitResult> {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

    const identifier = config.identifier === 'ip' ? ipAddress : userIdentifier
    const cacheKey = `${config.action}:${identifier}`

    // Verificar in-memory store primeiro
    const memEntry = memoryStore.get(cacheKey)
    const now = Date.now()

    if (memEntry && memEntry.resetAt > now) {
      const remaining = Math.max(0, config.maxAttempts - memEntry.count)
      const allowed = memEntry.count < config.maxAttempts

      return {
        allowed,
        remaining,
        resetAt: new Date(memEntry.resetAt),
        error: allowed ? undefined : `Muitas tentativas. Tente novamente em ${Math.ceil((memEntry.resetAt - now) / 1000)}s`
      }
    }

    // Se expirou no memory store, resetar
    if (memEntry) {
      memoryStore.delete(cacheKey)
    }

    // Contar tentativas recentes no banco
    const supabase = await createClient()
    const timeWindowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000)

    const { data, error } = await supabase
      .from('rate_limit_attempts')
      .select('count', { count: 'exact' })
      .eq('action', config.action)
      .eq(config.identifier === 'ip' ? 'ip_address' : 'user_email', identifier)
      .gte('created_at', timeWindowStart.toISOString())

    if (error) {
      console.error('Erro ao verificar rate limit:', error)
      // Em caso de erro, permitir (fail open)
      return { allowed: true, remaining: config.maxAttempts }
    }

    const count = data?.[0]?.count || 0
    const remaining = Math.max(0, config.maxAttempts - count)
    const allowed = count < config.maxAttempts
    const resetAt = new Date(Date.now() + config.windowMinutes * 60 * 1000)

    // Atualizar in-memory store
    memoryStore.set(cacheKey, {
      count,
      resetAt: resetAt.getTime()
    })

    return {
      allowed,
      remaining,
      resetAt,
      error: allowed ? undefined : `Muitas tentativas. Tente novamente em ${config.windowMinutes} minuto(s)`
    }
  } catch (error) {
    console.error('Erro crítico em rate limit:', error)
    // Em caso de erro, permitir (fail open)
    return { allowed: true, remaining: 0 }
  }
}

export async function recordAttempt(
  config: RateLimitConfig,
  userIdentifier: string,
  success: boolean,
  errorMessage?: string,
  tenantId?: string
): Promise<void> {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

    const supabase = await createClient()

    await supabase
      .from('rate_limit_attempts')
      .insert({
        tenant_id: tenantId || null,
        user_email: userIdentifier,
        action: config.action,
        ip_address: ipAddress,
        success,
        error_message: errorMessage,
      })
  } catch (error) {
    // Log silenciosamente - não queremos que erros de rate limiting quebre a app
    console.error('Erro ao registrar tentativa:', error)
  }
}

