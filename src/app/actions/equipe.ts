"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAudit } from "@/app/lib/audit"

async function getTenantAndRole(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', userId)
    .single()
  return profile || { tenant_id: null, role: null }
}

export async function getEquipe() {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { error: "Não autenticado." }

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Tenant não encontrado." }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('full_name')

    if (error) throw error
    return { data }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateRole(userIdToUpdate: string, newRole: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return { error: "Não autenticado." }

  const profile = await getTenantAndRole(supabase, authData.user.id)
  if (!profile.tenant_id) return { error: "Tenant não encontrado." }

  const tenantId = profile.tenant_id
  const role = profile.role?.toLowerCase() || ''
  const isAdmin = ['admin', 'gerente', 'dono'].includes(role)
  if (!isAdmin) return { error: "Sem permissão para alterar cargos." }

  try {
    // Buscar usuário ANTES de atualizar (para auditoria)
    const { data: userAntigo } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userIdToUpdate)
      .eq('tenant_id', tenantId)
      .single()

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userIdToUpdate)
      .eq('tenant_id', tenantId)

    if (error) {
      await logAudit({
        tenantId,
        userId: authData.user.id,
        userEmail: authData.user.email,
        action: 'UPDATE',
        resourceType: 'usuario',
        resourceId: userIdToUpdate,
        resourceName: userAntigo?.full_name,
        result: 'error',
        errorMessage: error.message,
      })
      throw error
    }

    await logAudit({
      tenantId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      action: 'UPDATE',
      resourceType: 'usuario',
      resourceId: userIdToUpdate,
      resourceName: userAntigo?.full_name,
      changes: {
        before: { role: userAntigo?.role },
        after: { role: newRole },
      },
      result: 'success',
    })

    revalidatePath("/equipe")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deactivateUser(userIdToDeactivate: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return { error: "Não autenticado." }

  const profile = await getTenantAndRole(supabase, authData.user.id)
  if (!profile.tenant_id) return { error: "Tenant não encontrado." }

  const tenantId = profile.tenant_id
  const role = profile.role?.toLowerCase() || ''
  const isAdmin = ['admin', 'gerente', 'dono'].includes(role)
  if (!isAdmin) return { error: "Sem permissão para desativar usuários." }

  // Não permite desativar a si mesmo
  if (userIdToDeactivate === authData.user.id) {
    return { error: "Você não pode desativar sua própria conta." }
  }

  try {
    // Buscar usuário ANTES de desativar (para auditoria)
    const { data: userAntigo } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userIdToDeactivate)
      .eq('tenant_id', tenantId)
      .single()

    const { error, data } = await supabase
      .from('profiles')
      .update({ ativo: false })
      .eq('id', userIdToDeactivate)
      .eq('tenant_id', tenantId)
      .select()

    if (error) {
      await logAudit({
        tenantId,
        userId: authData.user.id,
        userEmail: authData.user.email,
        action: 'DEACTIVATE',
        resourceType: 'usuario',
        resourceId: userIdToDeactivate,
        resourceName: userAntigo?.full_name,
        result: 'error',
        errorMessage: error.message,
      })
      throw error
    }
    if (!data || data.length === 0) {
      return { error: "Usuário não encontrado ou não pertence à sua empresa." }
    }

    await logAudit({
      tenantId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      action: 'DEACTIVATE',
      resourceType: 'usuario',
      resourceId: userIdToDeactivate,
      resourceName: userAntigo?.full_name,
      changes: {
        before: { ativo: userAntigo?.ativo },
        after: { ativo: false },
      },
      result: 'success',
    })

    revalidatePath("/equipe")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function deleteUser(userIdToDelete: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return { error: "Não autenticado." }

  const profile = await getTenantAndRole(supabase, authData.user.id)
  if (!profile.tenant_id) return { error: "Tenant não encontrado." }

  const tenantId = profile.tenant_id
  const role = profile.role?.toLowerCase() || ''
  const canDelete = ['admin', 'gerente', 'dono'].includes(role)
  if (!canDelete) return { error: "Você não tem permissão para deletar usuários." }

  // Não permite deletar a si mesmo
  if (userIdToDelete === authData.user.id) {
    return { error: "Você não pode deletar sua própria conta." }
  }

  try {
    // Buscar usuário ANTES de deletar (para auditoria)
    const { data: userAntigo } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userIdToDelete)
      .eq('tenant_id', tenantId)
      .single()

    // Deletar do Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userIdToDelete)
    if (authError) throw authError

    // Deletar do banco de dados (profiles)
    const { error: dbError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userIdToDelete)
      .eq('tenant_id', tenantId)

    if (dbError) throw dbError

    await logAudit({
      tenantId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      action: 'DELETE',
      resourceType: 'usuario',
      resourceId: userIdToDelete,
      resourceName: userAntigo?.full_name,
      changes: {
        before: userAntigo,
      },
      result: 'success',
    })

    revalidatePath("/equipe")
    return { success: true }
  } catch (error: any) {
    await logAudit({
      tenantId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      action: 'DELETE',
      resourceType: 'usuario',
      resourceId: userIdToDelete,
      result: 'error',
      errorMessage: error.message,
    })
    return { error: error.message }
  }
}
