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

export async function createFornecedor(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado. Faça login para continuar." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada. Execute o script de correção no Supabase." }

    const codigo = formData.get("codigo") as string
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

    // Validar CNPJ/CPF duplicado
    if (documento) {
      const { data: existing } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cnpj_cpf', documento)
        .single()

      if (existing) {
        return { error: `CNPJ/CPF já cadastrado para o fornecedor: "${existing.nome}"` }
      }
    }

    const { error } = await supabase
      .from('fornecedores')
      .insert({
        tenant_id: tenantId,
        codigo,
        nome,
        cnpj_cpf: documento,
        telefone: celular,
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
      console.error("Erro ao inserir fornecedor:", error)
      return { error: "Erro no banco de dados: " + error.message }
    }

    revalidatePath("/fornecedores")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function updateFornecedor(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada." }

    const codigo = formData.get("codigo") as string
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

    // Checar duplicado em OUTRO fornecedor
    if (documento) {
      const { data: existing } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cnpj_cpf', documento)
        .neq('id', id)
        .single()

      if (existing) {
        return { error: `CNPJ/CPF já cadastrado para o fornecedor: "${existing.nome}"` }
      }
    }

    const { error } = await supabase
      .from('fornecedores')
      .update({ codigo, nome, cnpj_cpf: documento, telefone: celular, email, cep, rua, numero, complemento, bairro, cidade, estado })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return { error: "Erro ao atualizar: " + error.message }

    revalidatePath("/fornecedores")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function deleteFornecedor(id: string) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada." }

    const { error } = await supabase
      .from('fornecedores')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return { error: "Erro ao excluir: " + error.message }

    revalidatePath("/fornecedores")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function getNextFornecedorCode() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return "FORN001"

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authData.user.id).single()
  if (!profile?.tenant_id) return "FORN001"

  const { data } = await supabase
    .from('fornecedores')
    .select('codigo')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!data || data.length === 0 || !data[0].codigo) return "FORN001"

  const match = data[0].codigo.match(/^FORN(\d+)$/)
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1
    return `FORN${nextNum.toString().padStart(3, '0')}`
  }

  return "FORN001"
}
