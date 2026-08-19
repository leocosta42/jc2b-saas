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

export async function createCliente(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado. Faça login para continuar." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada. Execute o script de correção no Supabase." }

    const nome = formData.get("nome") as string
    const documento = formData.get("documento") as string
    const celular = formData.get("celular") as string
    const email = formData.get("email") as string
    const cep = formData.get("cep") as string
    const rua = formData.get("rua") as string
    const numero = formData.get("numero") as string
    const complemento = formData.get("complemento") as string
    const bairro = formData.get("bairro") as string
    const cidade = formData.get("cidade") as string
    const estado = formData.get("estado") as string

    // Validar CPF/CNPJ duplicado
    if (documento) {
      const { data: existing } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cpf_cnpj', documento)
        .maybeSingle()

      if (existing) {
        return { error: `CPF/CNPJ já cadastrado para o cliente: "${existing.nome}"` }
      }
    }

    const { error } = await supabase
      .from('clientes')
      .insert({
        tenant_id: tenantId,
        nome,
        cpf_cnpj: documento,
        celular,
        email,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
      })

    if (error) {
      console.error("Erro ao inserir cliente:", error)
      return { error: "Erro no banco de dados: " + error.message }
    }

    revalidatePath("/clientes")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function updateCliente(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada." }

    const nome = formData.get("nome") as string
    const documento = formData.get("documento") as string
    const celular = formData.get("celular") as string
    const email = formData.get("email") as string
    const cep = formData.get("cep") as string
    const rua = formData.get("rua") as string
    const numero = formData.get("numero") as string
    const complemento = formData.get("complemento") as string
    const bairro = formData.get("bairro") as string
    const cidade = formData.get("cidade") as string
    const estado = formData.get("estado") as string

    // Validar CPF/CNPJ duplicado em OUTRO cliente
    if (documento) {
      const { data: existing } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cpf_cnpj', documento)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        return { error: `CPF/CNPJ já cadastrado para o cliente: "${existing.nome}"` }
      }
    }

    const { error } = await supabase
      .from('clientes')
      .update({ nome, cpf_cnpj: documento, celular, email, cep, rua, numero, complemento, bairro, cidade, estado })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return { error: "Erro ao atualizar: " + error.message }

    revalidatePath("/clientes")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function deleteCliente(id: string) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada." }

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return { error: "Erro ao excluir: " + error.message }

    revalidatePath("/clientes")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}
