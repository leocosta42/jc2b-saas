"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

const MOTIVOS_VALIDOS = ['entrada_manual', 'devolucao', 'perda', 'contagem'] as const

async function getProfile(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', userId)
    .single()
  return profile || { tenant_id: null, role: null }
}

export async function criarAjusteEstoque(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const profile = await getProfile(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Empresa não encontrada." }
    const tenantId = profile.tenant_id
    const role = profile.role?.toLowerCase() || ''
    const isAdmin = ['admin', 'gerente', 'dono'].includes(role)
    if (!isAdmin) return { error: "Sem permissão para ajustar o estoque." }

    const produtoId = formData.get("produto_id") as string
    const motivo = formData.get("motivo") as string
    const observacoes = (formData.get("observacoes") as string) || null
    const quantidadeNova = Number(formData.get("quantidade_nova"))

    if (!produtoId) return { error: "Selecione um produto." }
    if (!MOTIVOS_VALIDOS.includes(motivo as any)) return { error: "Motivo inválido." }
    if (!Number.isFinite(quantidadeNova) || quantidadeNova < 0) {
      return { error: "Informe um novo saldo válido (maior ou igual a zero)." }
    }

    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('id, nome, quantidade_estoque')
      .eq('id', produtoId)
      .eq('tenant_id', tenantId)
      .single()

    if (produtoError || !produto) return { error: "Produto não encontrado." }

    const quantidadeAnterior = produto.quantidade_estoque || 0
    if (quantidadeNova === quantidadeAnterior) {
      return { error: `O saldo de "${produto.nome}" já é ${quantidadeAnterior}. Informe um valor diferente para registrar o ajuste.` }
    }

    const { error: insertError } = await supabase
      .from('ajustes_estoque')
      .insert({
        tenant_id: tenantId,
        produto_id: produtoId,
        usuario_id: authData.user.id,
        quantidade_anterior: quantidadeAnterior,
        quantidade_nova: quantidadeNova,
        motivo,
        observacoes,
      })

    if (insertError) {
      return { error: "Erro ao registrar ajuste: " + insertError.message }
    }

    const { error: updateError } = await supabase
      .from('produtos')
      .update({ quantidade_estoque: quantidadeNova })
      .eq('id', produtoId)
      .eq('tenant_id', tenantId)

    if (updateError) {
      return { error: "Ajuste registrado, mas houve erro ao atualizar o saldo do produto: " + updateError.message }
    }

    revalidatePath("/estoque")
    revalidatePath("/estoque/ajustes")
    return { success: true, produtoNome: produto.nome }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function getSaldoAtualProduto(produtoId: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return null

  const profile = await getProfile(supabase, authData.user.id)
  if (!profile.tenant_id) return null

  const { data } = await supabase
    .from('produtos')
    .select('id, nome, sku, quantidade_estoque')
    .eq('id', produtoId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  return data || null
}

export async function getProdutosParaConsulta() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return []

  const profile = await getProfile(supabase, authData.user.id)
  if (!profile.tenant_id) return []

  const { data } = await supabase
    .from('produtos')
    .select('id, nome, sku, quantidade_estoque')
    .eq('tenant_id', profile.tenant_id)
    .eq('ativo', true)
    .order('sku')
    .limit(200)

  return data || []
}

export async function getAjustesEstoque({ page = 1, produtoId }: { page?: number; produtoId?: string } = {}) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return { data: [], totalPages: 1, totalCount: 0 }

  const profile = await getProfile(supabase, authData.user.id)
  if (!profile.tenant_id) return { data: [], totalPages: 1, totalCount: 0 }

  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('ajustes_estoque')
    .select('id, quantidade_anterior, quantidade_nova, motivo, observacoes, created_at, produtos(nome, sku), profiles(full_name)', { count: 'exact' })
    .eq('tenant_id', profile.tenant_id)

  if (produtoId) query = query.eq('produto_id', produtoId)

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { data: [], totalPages: 1, totalCount: 0 }

  const normalized = (data || []).map((row: any) => ({
    ...row,
    produtos: Array.isArray(row.produtos) ? (row.produtos[0] ?? null) : row.produtos,
    profiles: Array.isArray(row.profiles) ? (row.profiles[0] ?? null) : row.profiles,
  }))

  return {
    data: normalized,
    totalPages: count ? Math.ceil(count / limit) : 1,
    totalCount: count || 0,
  }
}
