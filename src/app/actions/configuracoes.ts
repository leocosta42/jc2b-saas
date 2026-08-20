"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

async function getTenantId(supabase: any, userId: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .single()
  return profile?.tenant_id || null
}

export async function getTenantConfig() {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return null

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return null

    const { data } = await supabase
      .from('tenants')
      .select('id, name, cnpj, telefone, email, endereco, logo_url')
      .eq('id', tenantId)
      .single()

    return data
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return null
  }
}

export async function updateTenantConfig(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada." }

    const rawData = {
      name: formData.get("name") as string,
      cnpj: formData.get("cnpj") as string,
      telefone: formData.get("telefone") as string,
      email: formData.get("email") as string,
      endereco: formData.get("endereco") as string,
      logo_url: formData.get("logo_url") as string,
    }

    if (!rawData.name) {
      return { error: "O nome da empresa é obrigatório." }
    }

    const { error } = await supabase
      .from('tenants')
      .update(rawData)
      .eq('id', tenantId)

    if (error) {
      return { error: "Erro ao atualizar: " + error.message }
    }

    revalidatePath("/configuracoes")
    revalidatePath("/imprimir") // Atualiza possíveis PDFs gerados
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}
