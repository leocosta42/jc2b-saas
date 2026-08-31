"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

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
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { error: "Não autenticado." }

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Tenant não encontrado." }

    const role = profile.role?.toLowerCase() || ''
    const isAdmin = ['admin', 'gerente', 'dono'].includes(role)
    if (!isAdmin) return { error: "Sem permissão para alterar cargos." }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userIdToUpdate)
      .eq('tenant_id', profile.tenant_id) // Segurança: só pode alterar gente do próprio tenant

    if (error) throw error

    revalidatePath("/equipe")
    return { success: true }
  } catch (error: any) {
    return { error: error.message }
  }
}
