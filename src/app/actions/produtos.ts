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

export async function createProduto(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Empresa não encontrada." }
    const tenantId = profile.tenant_id
    const isAdmin = profile.role === 'admin' || profile.role === 'gerente'

    const codigo = formData.get("codigo") as string
    const descricao = formData.get("descricao") as string
    const um = formData.get("um") as string
    const preco_custo = Number(formData.get("preco_custo")) || 0
    const preco_venda = Number(formData.get("preco_venda")) || 0
    const quantidade_estoque = Number(formData.get("quantidade_estoque")) || 0
    const fornecedor_id = formData.get("fornecedor_id") as string

    if (!descricao) return { error: "A descrição é obrigatória." }

    const insertPayload: any = {
        tenant_id: tenantId,
        sku: codigo,
        nome: descricao,
        descricao: um, // Guardando U.M aqui provisoriamente
        preco_venda,
        fornecedor_id: fornecedor_id || null,
        ncm: formData.get("ncm") as string || null,
        peso: Number(formData.get("peso")) || 0,
    }

    if (isAdmin) {
      insertPayload.preco_custo = preco_custo
      insertPayload.quantidade_estoque = quantidade_estoque
      insertPayload.bloqueado = formData.get("bloqueado") === 'true'
    } else {
      insertPayload.preco_custo = 0
      insertPayload.quantidade_estoque = 0
      insertPayload.bloqueado = false
    }

    const { error } = await supabase
      .from('produtos')
      .insert(insertPayload)

    if (error) {
      console.error("Erro ao inserir produto:", error)
      return { error: "Erro no banco de dados: " + error.message }
    }

    revalidatePath("/estoque")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function updateProduto(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Empresa não encontrada." }
    const tenantId = profile.tenant_id
    const isAdmin = profile.role === 'admin' || profile.role === 'gerente'

    const codigo = formData.get("codigo") as string
    const descricao = formData.get("descricao") as string
    const um = formData.get("um") as string
    const preco_custo = Number(formData.get("preco_custo")) || 0
    const preco_venda = Number(formData.get("preco_venda")) || 0
    const quantidade_estoque = Number(formData.get("quantidade_estoque")) || 0
    const fornecedor_id = formData.get("fornecedor_id") as string

    if (!descricao) return { error: "A descrição é obrigatória." }

    const updatePayload: any = {
        sku: codigo,
        nome: descricao,
        descricao: um,
        preco_venda,
        fornecedor_id: fornecedor_id || null,
        ncm: formData.get("ncm") as string || null,
        peso: Number(formData.get("peso")) || 0,
    }

    if (isAdmin) {
      updatePayload.preco_custo = preco_custo
      updatePayload.quantidade_estoque = quantidade_estoque
      updatePayload.bloqueado = formData.get("bloqueado") === 'true'
    }

    const { error } = await supabase
      .from('produtos')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error("Erro ao atualizar produto:", error)
      return { error: "Erro no banco de dados: " + error.message }
    }

    revalidatePath("/estoque")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function deleteProduto(id: string) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Empresa não encontrada." }
    const tenantId = profile.tenant_id

    const { error } = await supabase
      .from('produtos')
      .update({ ativo: false })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error("Erro ao deletar produto:", error)
      if (error.code === '23503') {
        return { error: "Não é possível excluir este produto pois ele já está vinculado a um ou mais pedidos/orçamentos. Para manter o histórico correto, considere apenas desativá-lo." }
      }
      return { error: "Erro no banco de dados: " + error.message }
    }

    revalidatePath("/estoque")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function getFornecedoresList() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return []

  const tenantId = await getTenantId(supabase, authData.user.id)
  if (!tenantId) return []

  const { data } = await supabase
    .from('fornecedores')
    .select('id, nome, codigo')
    .eq('tenant_id', tenantId)
    .eq('ativo', true)
    .order('nome')

  return data || []
}

export async function getNextSku() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return 'PRO0001'

  const profile = await getTenantAndRole(supabase, authData.user.id)
  if (!profile.tenant_id) return 'PRD0001'
  const tenantId = profile.tenant_id

  // Busca o último produto que comece com PRO e tenha números
  const { data, error } = await supabase
    .from('produtos')
    .select('sku')
    .eq('tenant_id', tenantId)
    .ilike('sku', 'PRO%')
    .order('sku', { ascending: false })
    .limit(1)
    .single()

  if (error || !data || !data.sku) {
    return 'PRO0001'
  }

  const match = data.sku.match(/PRO(\d+)/i)
  if (match && match[1]) {
    const nextNum = parseInt(match[1], 10) + 1
    return `PRO${String(nextNum).padStart(4, '0')}`
  }

  return 'PRO0001'
}

export async function getProdutoById(id: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return null

  const tenantId = await getTenantId(supabase, authData.user.id)
  if (!tenantId) return null

  const { data } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  return data
}
