"use server"

import { createClient } from "@/lib/supabase/server"
import { getAuditLog } from "@/app/lib/audit"

async function getTenantAndRole(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', userId)
    .single()
  return profile || { tenant_id: null, role: null }
}

// Buscar resumo de auditoria
export async function getAuditSummary() {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { error: "Não autenticado" }

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Tenant não encontrado" }

    const tenantId = profile.tenant_id

    // Últimas 10 operações
    const { data: recentLogs } = await getAuditLog(tenantId, {
      limit: 10,
    })

    // Contar operações por tipo
    const { data: countByType, error: typeError } = await supabase
      .from('audit_log')
      .select('resource_type', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Contar erros nos últimos 7 dias
    const { data: errors, error: errError } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('result', 'error')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    // Usuários mais ativos
    const { data: activeUsers } = await supabase
      .from('audit_log')
      .select('user_email')
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(100)

    const userActivity = activeUsers?.reduce((acc: any, log: any) => {
      acc[log.user_email] = (acc[log.user_email] || 0) + 1
      return acc
    }, {}) || {}

    const topUsers = Object.entries(userActivity)
      .map(([email, count]) => ({ email, count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5)

    return {
      recentLogs,
      errorCount: errors?.length || 0,
      totalOperations: countByType?.length || 0,
      topUsers,
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Detectar comportamentos suspeitos
export async function detectSecurityThreats() {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { error: "Não autenticado" }

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Tenant não encontrado" }

    const tenantId = profile.tenant_id
    const alerts: any[] = []

    // 1. Múltiplas tentativas de login falhadas
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const { data: failedLogins, count: failedCount } = await supabase
      .from('audit_log')
      .select('user_email', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('action', 'login')
      .eq('result', 'error')
      .gte('created_at', last24h.toISOString())

    const failedByEmail = failedLogins?.reduce((acc: any, log: any) => {
      acc[log.user_email] = (acc[log.user_email] || 0) + 1
      return acc
    }, {}) || {}

    Object.entries(failedByEmail).forEach(([email, count]: [string, any]) => {
      if (count >= 5) {
        alerts.push({
          severity: 'high',
          type: 'brute_force',
          message: `${count} tentativas de login falhadas para ${email} nas últimas 24h`,
          timestamp: new Date(),
        })
      }
    })

    // 2. Exclusões em massa
    const { data: deletions, count: deleteCount } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('action', 'DELETE')
      .gte('created_at', last24h.toISOString())

    if ((deleteCount || 0) > 10) {
      alerts.push({
        severity: 'medium',
        type: 'mass_deletion',
        message: `${deleteCount} operações de exclusão registradas nas últimas 24h`,
        timestamp: new Date(),
      })
    }

    // 3. Alterações de usuários suspeitas
    const { data: userChanges } = await supabase
      .from('audit_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('action', ['UPDATE', 'DELETE'])
      .eq('resource_type', 'usuario')
      .gte('created_at', last24h.toISOString())

    if ((userChanges?.length || 0) > 5) {
      alerts.push({
        severity: 'high',
        type: 'user_manipulation',
        message: `${userChanges?.length} mudanças em usuários detectadas nas últimas 24h`,
        timestamp: new Date(),
      })
    }

    // 4. Alta taxa de erro geral
    const { count: errorCount } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('result', 'error')
      .gte('created_at', last24h.toISOString())

    const { count: totalCount } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', last24h.toISOString())

    const errorRate = totalCount ? ((errorCount || 0) / totalCount) * 100 : 0
    if (errorRate > 20) {
      alerts.push({
        severity: 'medium',
        type: 'high_error_rate',
        message: `Taxa de erro anormalmente alta: ${errorRate.toFixed(1)}% nas últimas 24h`,
        timestamp: new Date(),
      })
    }

    return {
      alerts: alerts.sort((a, b) => {
        const severityOrder = { high: 0, medium: 1, low: 2 }
        return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]
      }),
      threatCount: alerts.length,
    }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Buscar logs de um usuário específico
export async function getUserActivityLog(userEmail: string, limit: number = 50) {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { error: "Não autenticado" }

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Tenant não encontrado" }

    const tenantId = profile.tenant_id

    const { data: logs, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { logs }
  } catch (error: any) {
    return { error: error.message }
  }
}

// Exportar logs para análise
export async function exportAuditLogs(format: 'json' | 'csv' = 'json', days: number = 30) {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { error: "Não autenticado" }

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Tenant não encontrado" }

    // Verificar permissão (apenas admin/gerente/dono)
    const role = profile.role?.toLowerCase() || ''
    const canExport = ['admin', 'gerente', 'dono'].includes(role)
    if (!canExport) return { error: "Sem permissão para exportar logs" }

    const tenantId = profile.tenant_id
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const { data: logs, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    if (format === 'csv') {
      // Converter para CSV
      const headers = [
        'Timestamp',
        'Usuário',
        'Email',
        'Ação',
        'Tipo de Recurso',
        'Nome do Recurso',
        'Resultado',
        'Mensagem de Erro',
        'IP Address',
      ]

      const rows = logs?.map((log: any) => [
        log.created_at,
        log.user_name || '-',
        log.user_email,
        log.action,
        log.resource_type,
        log.resource_name || '-',
        log.result,
        log.error_message || '-',
        log.ip_address,
      ]) || []

      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n')

      return { data: csv, format: 'text/csv' }
    } else {
      return { data: JSON.stringify(logs, null, 2), format: 'application/json' }
    }
  } catch (error: any) {
    return { error: error.message }
  }
}
