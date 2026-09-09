"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'DEACTIVATE'

export type AuditResourceType =
  | 'cliente'
  | 'usuario'
  | 'pedido'
  | 'orcamento'
  | 'produto'
  | 'fornecedor'
  | 'vendedor'
  | 'estoque'

export type AuditResult = 'success' | 'error' | 'warning'

interface AuditLogParams {
  tenantId: string
  userId: string
  userEmail?: string
  userName?: string
  action: AuditAction
  resourceType: AuditResourceType
  resourceId?: string
  resourceName?: string
  changes?: {
    before?: Record<string, any>
    after?: Record<string, any>
  }
  result: AuditResult
  errorMessage?: string
}

export async function logAudit(params: AuditLogParams) {
  try {
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    const supabase = await createClient()

    const { error } = await supabase
      .from('audit_log')
      .insert({
        tenant_id: params.tenantId,
        user_id: params.userId,
        user_email: params.userEmail,
        user_name: params.userName,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        resource_name: params.resourceName,
        changes: params.changes,
        result: params.result,
        error_message: params.errorMessage,
        ip_address: ipAddress,
        user_agent: userAgent,
      })

    if (error) {
      console.error('Erro ao registrar auditoria:', error)
      // Não throw - não queremos que erro de auditoria quebre a aplicação
    }
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error)
    // Silenciosamente falha
  }
}

export async function getAuditLog(
  tenantId: string,
  options?: {
    limit?: number
    offset?: number
    resourceType?: AuditResourceType
    action?: AuditAction
    userId?: string
  }
) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (options?.resourceType) {
      query = query.eq('resource_type', options.resourceType)
    }
    if (options?.action) {
      query = query.eq('action', options.action)
    }
    if (options?.userId) {
      query = query.eq('user_id', options.userId)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }
    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1)
    }

    const { data, error, count } = await query

    if (error) throw error
    return { data, count, error: null }
  } catch (error: any) {
    return { data: null, count: null, error: error.message }
  }
}
