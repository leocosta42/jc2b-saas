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

async function fetchTop(supabase: any, table: string, select: string, tenantId: string, limit: number = 100, orderBy: string = 'nome') {
  const { data, error } = await supabase
    .from(table)
    .select(select)
    .eq('tenant_id', tenantId)
    .eq('ativo', true)
    .order(orderBy)
    .limit(limit)

  if (error) throw error
  return data || []
}

// Busca os dados para alimentar os selects (clientes, vendedores, produtos)
export async function getFormData() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return { clientes: [], vendedores: [], produtos: [] }

  const tenantId = await getTenantId(supabase, authData.user.id)
  if (!tenantId) return { clientes: [], vendedores: [], produtos: [] }

  const [clientesData, vendedoresData, produtosData, tenantRes] = await Promise.all([
    fetchTop(supabase, 'clientes', 'id, codigo, nome, cpf_cnpj, rua, numero, bairro, cidade, estado, cep, celular, email', tenantId),
    fetchTop(supabase, 'vendedores', 'id, nome', tenantId, 1000), // vendedores usually don't exceed 1000
    fetchTop(supabase, 'produtos', 'id, nome, sku, preco_venda, quantidade_estoque, ncm, peso', tenantId, 100, 'sku'),
    supabase.from('tenants').select('cep').eq('id', tenantId).single()
  ])

  return {
    clientes: clientesData,
    vendedores: vendedoresData,
    produtos: produtosData,
    tenant_cep: tenantRes.data?.cep || '13400820'
  }
}

export async function searchClientesAPI(query: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return []
  const tenantId = await getTenantId(supabase, authData.user.id)
  if (!tenantId) return []

  const { data } = await supabase
    .from('clientes')
    .select('id, codigo, nome, cpf_cnpj, rua, numero, bairro, cidade, estado, cep, celular, email')
    .eq('tenant_id', tenantId)
    .eq('ativo', true)
    .or(`nome.ilike.%${query}%,cpf_cnpj.ilike.%${query}%,codigo.ilike.%${query}%`)
    .limit(50)
  
  return data || []
}

export async function searchProdutosAPI(query: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return []
  const tenantId = await getTenantId(supabase, authData.user.id)
  if (!tenantId) return []

  const { data } = await supabase
    .from('produtos')
    .select('id, nome, sku, preco_venda, quantidade_estoque, ncm, peso')
    .eq('tenant_id', tenantId)
    .eq('ativo', true)
    .or(`nome.ilike.%${query}%,sku.ilike.%${query}%`)
    .limit(50)
  
  return data || []
}

export async function getProdutosPaginados(offset: number, limit: number = 100) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return []
  const tenantId = await getTenantId(supabase, authData.user.id)
  if (!tenantId) return []

  const { data } = await supabase
    .from('produtos')
    .select('id, nome, sku, preco_venda, quantidade_estoque, ncm, peso')
    .eq('tenant_id', tenantId)
    .eq('ativo', true)
    .order('sku')
    .range(offset, offset + limit - 1)

  return data || []
}

export async function createDocumento(data: {
  tipo: 'ORCAMENTO' | 'PEDIDO'
  cliente_id: string
  vendedor_id: string
  data_emissao: string
  data_entrega?: string
  forma_pagamento?: string
  observacoes?: string
  valor_frete?: number
  tipo_frete?: string
  desconto_total?: number
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

    // 0. Validar que todo produto_id enviado realmente pertence a este tenant
    // (evita que um pedido/orcamento seja criado referenciando produto_id de
    // outro tenant - o RLS ja bloquearia a baixa de estoque no final, mas sem
    // isso o item_pedido chegava a ser gravado com o id "emprestado", vazando
    // nome/sku de outro tenant em quem consultasse o documento depois).
    const produtoIdsSolicitados = [...new Set(data.itens.map(i => i.produto_id))]
    const { data: produtosEncontrados } = await supabase
      .from('produtos')
      .select('id, quantidade_estoque, nome, sku')
      .eq('tenant_id', tenantId)
      .in('id', produtoIdsSolicitados)

    const produtosCache: any[] = produtosEncontrados || []
    const idsEncontrados = new Set(produtosCache.map(p => p.id))
    const idsInvalidos = produtoIdsSolicitados.filter(id => !idsEncontrados.has(id))
    if (idsInvalidos.length > 0) {
      return { error: "Um ou mais produtos selecionados não foram encontrados. Atualize a página e tente novamente." }
    }

    // Se for PEDIDO, validar estoque de TODOS os itens antes de começar
    // (checagem otimista para UX rapida - a garantia de fato vem do UPDATE
    // atomico em ajustar_estoque() mais abaixo, que nao deixa o saldo ficar
    // negativo mesmo sob concorrencia).
    if (data.tipo === 'PEDIDO') {
      for (const item of data.itens) {
        const prod = produtosCache.find(p => p.id === item.produto_id)
        if (prod && (prod.quantidade_estoque || 0) < item.quantidade) {
          const skuDisplay = prod.sku ? `[${prod.sku}] ` : '';
          return { error: `Estoque insuficiente! O produto ${skuDisplay}"${prod.nome}" possui apenas ${prod.quantidade_estoque || 0} em estoque. O pedido exige ${item.quantidade}.` }
        }
      }
    }

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
        valor_frete: data.valor_frete || 0,
        tipo_frete: data.tipo_frete || 'CIF',
        desconto_total: data.desconto_total || 0,
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

    if (itensError) {
      // Rollback: deletar o pedido criado já que os itens falharam
      await supabase.from('pedidos').delete().eq('id', pedido.id).eq('tenant_id', tenantId)
      return { error: "Erro ao inserir itens. A operação foi cancelada. " + itensError.message }
    }

    // 3. Se for PEDIDO, precisa dar baixa no estoque (atomico, item a item)
    if (data.tipo === 'PEDIDO') {
      const baixasRealizadas: { produto_id: string, qtd: number }[] = []

      for (const item of data.itens) {
        const { data: novoSaldo, error: rpcError } = await supabase.rpc('ajustar_estoque', {
          p_produto_id: item.produto_id,
          p_tenant_id: tenantId,
          p_delta: -item.quantidade
        })

        if (rpcError || novoSaldo === null) {
          // Rollback das baixas já realizadas nesta operação
          for (const baixa of baixasRealizadas) {
            await supabase.rpc('ajustar_estoque', { p_produto_id: baixa.produto_id, p_tenant_id: tenantId, p_delta: baixa.qtd })
          }
          // Deletar o pedido e itens
          await supabase.from('pedidos').delete().eq('id', pedido.id).eq('tenant_id', tenantId)
          const prod = produtosCache.find(p => p.id === item.produto_id)
          const skuDisplay = prod?.sku ? `[${prod.sku}] ` : ''
          return { error: `Estoque insuficiente para ${skuDisplay}"${prod?.nome || 'produto'}" no momento da confirmação. O pedido foi desfeito para manter a consistência.` }
        }

        baixasRealizadas.push({ produto_id: item.produto_id, qtd: item.quantidade })
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
      .select('produto_id, quantidade, produtos(nome, sku)')
      .eq('pedido_id', id)
      .eq('tenant_id', tenantId)

    // Validar estoque ANTES de converter (checagem otimista - a garantia
    // final vem do UPDATE atomico em ajustar_estoque() mais abaixo)
    let produtosCache: any[] = []
    if (itens) {
      const produtoIds = itens.map(i => i.produto_id)
      const { data: produtos } = await supabase.from('produtos').select('id, quantidade_estoque, nome, sku').eq('tenant_id', tenantId).in('id', produtoIds)
      produtosCache = produtos || []
      
      for (const item of itens) {
        const prod = produtosCache.find(p => p.id === item.produto_id)
        if (prod && (prod.quantidade_estoque || 0) < item.quantidade) {
          const skuDisplay = prod.sku ? `[${prod.sku}] ` : '';
          return { error: `Estoque insuficiente! O produto ${skuDisplay}"${prod.nome}" possui apenas ${prod.quantidade_estoque || 0} em estoque. O pedido exige ${item.quantidade}.` }
        }
      }
    }

    // Atualizar tipo
    const { error } = await supabase
      .from('pedidos')
      .update({ tipo: 'PEDIDO', status: 'Aprovado' })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return { error: error.message }

    // Baixa de estoque com rollback (atomico, item a item)
    if (itens) {
      const baixasRealizadas: { produto_id: string, qtd: number }[] = []

      for (const item of itens) {
        const { data: novoSaldo, error: rpcError } = await supabase.rpc('ajustar_estoque', {
          p_produto_id: item.produto_id,
          p_tenant_id: tenantId,
          p_delta: -item.quantidade
        })

        if (rpcError || novoSaldo === null) {
          // Rollback: restaurar estoque das baixas já feitas
          for (const baixa of baixasRealizadas) {
            await supabase.rpc('ajustar_estoque', { p_produto_id: baixa.produto_id, p_tenant_id: tenantId, p_delta: baixa.qtd })
          }
          // Rollback: Voltar para ORCAMENTO
          await supabase.from('pedidos').update({ tipo: 'ORCAMENTO', status: 'Aberto' }).eq('id', id).eq('tenant_id', tenantId)
          return { error: "Erro ao baixar o estoque (saldo insuficiente no momento da aprovação). A aprovação do pedido foi cancelada para manter a consistência." }
        }

        baixasRealizadas.push({ produto_id: item.produto_id, qtd: item.quantidade })
      }
    }

    revalidatePath("/orcamentos")
    revalidatePath("/pedidos")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro: " + err.message }
  }
}

export async function deleteDocumento(id: string, tipo: 'ORCAMENTO' | 'PEDIDO') {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData?.user) return { error: "Não autenticado" }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada" }

    // Se for PEDIDO, precisa devolver o estoque antes de apagar
    if (tipo === 'PEDIDO') {
      const { data: itens } = await supabase
        .from('itens_pedido')
        .select('produto_id, quantidade')
        .eq('pedido_id', id)
        .eq('tenant_id', tenantId)

      if (itens && itens.length > 0) {
        await Promise.all(itens.map((item) =>
          supabase.rpc('ajustar_estoque', { p_produto_id: item.produto_id, p_tenant_id: tenantId, p_delta: item.quantidade })
        ))
      }
    }

    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) return { error: error.message }

    revalidatePath("/orcamentos")
    revalidatePath("/pedidos")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro: " + err.message }
  }
}

export async function getPedidoCompletoById(id: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return null

  const tenantId = await getTenantId(supabase, authData.user.id)
  if (!tenantId) return null

  const { data: pedido } = await supabase
    .from('pedidos')
    .select(`
      id, tipo, cliente_id, vendedor_id, data_emissao, data_entrega, forma_pagamento, observacoes, status, valor_frete, desconto_total,
      itens_pedido (
        id, produto_id, quantidade, preco_unitario, desconto_percentual, unidade_medida,
        produtos ( sku, nome )
      )
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  return pedido
}

export async function updateDocumento(id: string, data: any) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada." }

    // 0. Validar que todo produto_id enviado pertence a este tenant, antes
    // de mexer em qualquer coisa (mesmo motivo do createDocumento).
    const produtoIdsSolicitados = [...new Set((data.itens || []).map((i: any) => i.produto_id))]
    const { data: produtosEncontrados } = await supabase
      .from('produtos')
      .select('id')
      .eq('tenant_id', tenantId)
      .in('id', produtoIdsSolicitados)

    const idsEncontrados = new Set((produtosEncontrados || []).map((p: any) => p.id))
    const idsInvalidos = produtoIdsSolicitados.filter((pid) => !idsEncontrados.has(pid))
    if (idsInvalidos.length > 0) {
      return { error: "Um ou mais produtos selecionados não foram encontrados. Atualize a página e tente novamente." }
    }

    // 1. Fetch old items to revert stock if PEDIDO (restauracao atomica)
    if (data.tipo === 'PEDIDO') {
      const { data: oldItens } = await supabase.from('itens_pedido').select('produto_id, quantidade').eq('pedido_id', id).eq('tenant_id', tenantId)
      if (oldItens) {
        await Promise.all(oldItens.map((item) =>
          supabase.rpc('ajustar_estoque', { p_produto_id: item.produto_id, p_tenant_id: tenantId, p_delta: item.quantidade })
        ))
      }
    }

    // 2. Delete old items
    await supabase.from('itens_pedido').delete().eq('pedido_id', id).eq('tenant_id', tenantId)

    // 3. Update pedido
    const { error: pedidoError } = await supabase
      .from('pedidos')
      .update({
        cliente_id: data.cliente_id,
        vendedor_id: data.vendedor_id || null,
        data_emissao: data.data_emissao,
        data_entrega: data.data_entrega || null,
        forma_pagamento: data.forma_pagamento,
        observacoes: data.observacoes,
        valor_frete: data.valor_frete || 0,
        tipo_frete: data.tipo_frete || 'CIF',
        desconto_total: data.desconto_total || 0
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (pedidoError) return { error: "Erro ao atualizar documento: " + pedidoError.message }

    // 4. Insert new items
    const itensToInsert = data.itens.map((item: any) => ({
      tenant_id: tenantId,
      pedido_id: id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario,
      desconto_percentual: item.desconto_percentual,
      unidade_medida: item.unidade_medida
    }))

    const { error: itensError } = await supabase.from('itens_pedido').insert(itensToInsert)
    if (itensError) return { error: "Erro ao inserir itens: " + itensError.message }

    // 5. If PEDIDO, reduce stock based on new items (atomico, item a item,
    // com rollback das baixas ja aplicadas nesta operacao caso alguma falhe)
    if (data.tipo === 'PEDIDO') {
      const baixasRealizadas: { produto_id: string, qtd: number }[] = []

      for (const item of data.itens) {
        const { data: novoSaldo, error: rpcError } = await supabase.rpc('ajustar_estoque', {
          p_produto_id: item.produto_id,
          p_tenant_id: tenantId,
          p_delta: -item.quantidade
        })

        if (rpcError || novoSaldo === null) {
          for (const baixa of baixasRealizadas) {
            await supabase.rpc('ajustar_estoque', { p_produto_id: baixa.produto_id, p_tenant_id: tenantId, p_delta: baixa.qtd })
          }
          return { error: "Estoque insuficiente para um dos itens no momento de salvar. O documento foi atualizado, mas revise o estoque antes de tentar novamente." }
        }

        baixasRealizadas.push({ produto_id: item.produto_id, qtd: item.quantidade })
      }
    }

    revalidatePath(data.tipo === 'ORCAMENTO' ? "/orcamentos" : "/pedidos")
    return { success: true, id }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

