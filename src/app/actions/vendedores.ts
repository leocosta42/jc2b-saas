"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createVendedor(formData: FormData) {
  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) {
    return { error: "Usuário não autenticado." }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', authData.user.id)
    .single()

  if (!profile?.tenant_id) {
    return { error: "Tenant não encontrado para este usuário." }
  }

  const nome = formData.get("nome") as string
  const telefone = formData.get("telefone") as string
  const email = formData.get("email") as string
  const comissao = parseFloat(formData.get("comissao_percentual") as string) || 0
  
  const { error } = await supabase
    .from('vendedores')
    .insert({
      tenant_id: profile.tenant_id,
      nome,
      telefone,
      email,
      comissao_percentual: comissao
    })

  if (error) {
    console.error("Erro ao inserir vendedor:", error)
    return { error: error.message }
  }

  revalidatePath("/vendedores")
  return { success: true }
}
