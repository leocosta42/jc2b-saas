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

// Busca os dados para alimentar os selects (clientes, vendedores, produtos)
export async function getFormData() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return { clientes: [], vendedores: [], produtos: [] }

  const tenantId = await getTenantId(supabase, authData.user.id)
  if (!tenantId) return { clientes: [], vendedores: [], produtos: [] }

  const [clientesRes, vendedoresRes, produtosRes] = await Promise.all([
    supabase.from('clientes').select('id, nome, cpf_cnpj, rua, numero, bairro, cidade, estado, celular, email').eq('tenant_id', tenantId).order('nome'),
    supabase.from('vendedores').select('id, nome').eq('tenant_id', tenantId).order('nome'),
    supabase.from('produtos').select('id, nome, sku, preco_venda').eq('tenant_id', tenantId).order('nome')
  ])

  return {
    clientes: clientesRes.data || [],
    vendedores: vendedoresRes.data || [],
    produtos: produtosRes.data || []
  }
}

export async function createDocumento(data: {
  tipo: 'ORCAMENTO' | 'PEDIDO'
  cliente_id: string
  vendedor_id: string
  data_emissao: string
  data_entrega: string
  forma_pagamento: string
  observacoes: string
  itens: Array<{
    produto_id: string
    quantidade: number
    preco_unitario: number
    desconto_percentual: number
    unidade_medida: string
  }>
}) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada." }

    // 1. Inserir na tabela pedidos (como ORCAMENTO ou PEDIDO)
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        tenant_id: tenantId,
        tipo: data.tipo,
        cliente_id: data.cliente_id,
        vendedor_id: data.vendedor_id || null,
        data_emissao: data.data_emissao,
        data_entrega: data.data_entrega || null,
        forma_pagamento: data.forma_pagamento,
        observacoes: data.observacoes,
        status: data.tipo === 'ORCAMENTO' ? 'Aberto' : 'Pendente'
      })
      .select('id')
      .single()

    if (pedidoError) return { error: "Erro ao criar documento: " + pedidoError.message }

    // 2. Preparar e inserir os itens
    const itensToInsert = data.itens.map(item => ({
      tenant_id: tenantId,
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      desconto_percentual: item.desconto_percentual,
      unidade_medida: item.unidade_medida
    }))

    const { error: itensError } = await supabase
      .from('itens_pedido')
      .insert(itensToInsert)

    if (itensError) return { error: "Erro ao inserir itens: " + itensError.message }

    // 3. Se for PEDIDO, precisa dar baixa no estoque
    if (data.tipo === 'PEDIDO') {
      for (const item of data.itens) {
        // Busca estoque atual
        const { data: prod } = await supabase
          .from('produtos')
          .select('quantidade_estoque')
          .eq('id', item.produto_id)
          .single()
          
        if (prod) {
          await supabase
            .from('produtos')
            .update({ quantidade_estoque: (prod.quantidade_estoque || 0) - item.quantidade })
            .eq('id', item.produto_id)
        }
      }
    }

    revalidatePath(data.tipo === 'ORCAMENTO' ? "/orcamentos" : "/pedidos")
    return { success: true, id: pedido.id }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function convertToPedido(id: string) {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { error: "Não autenticado" }

    const tenantId = await getTenantId(supabase, authData.user.id)

    // Pegar itens para baixar estoque
    const { data: itens } = await supabase
      .from('itens_pedido')
      .select('produto_id, quantidade')
      .eq('pedido_id', id)
      .eq('tenant_id', tenantId)

    // Atualizar tipo
    const { error } = await supabase
      .from('pedidos')
      .update({ tipo: 'PEDIDO', status: 'Aprovado' })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return { error: error.message }

    // Baixa de estoque
    if (itens) {
      for (const item of itens) {
        const { data: prod } = await supabase.from('produtos').select('quantidade_estoque').eq('id', item.produto_id).single()
        if (prod) {
          await supabase.from('produtos').update({ quantidade_estoque: (prod.quantidade_estoque || 0) - item.quantidade }).eq('id', item.produto_id)
        }
      }
    }

    revalidatePath("/orcamentos")
    revalidatePath("/pedidos")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro: " + err.message }
  }
}
