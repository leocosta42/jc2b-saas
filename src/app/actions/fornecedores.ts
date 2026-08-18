"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createFornecedor(formData: FormData) {
  const supabase = await createClient()

  // Precisamos do tenant_id do usuário logado
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
  const cnpj_cpf = formData.get("documento") as string
  const telefone = formData.get("celular") as string
  const email = formData.get("email") as string

  // No schema atual temos apenas nome, cnpj_cpf, telefone, email.
  // Em uma etapa futura, podemos criar uma migration para adicionar campos de endereço e inscrição estadual.
  
  const { error } = await supabase
    .from('fornecedores')
    .insert({
      tenant_id: profile.tenant_id,
      nome,
      cnpj_cpf,
      telefone,
      email
    })

  if (error) {
    console.error("Erro ao inserir fornecedor:", error)
    return { error: error.message }
  }

  revalidatePath("/fornecedores")
  return { success: true }
}
