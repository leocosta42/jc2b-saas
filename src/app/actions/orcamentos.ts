"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type ProdutoOrcamento = {
  codigo: string
  descricao: string
  qtde: number
  valorUnit: number
}

type OrcamentoData = {
  cliente_nome: string
  cif_fob: string
  data_emissao: string
  data_entrega: string
  produtos: ProdutoOrcamento[]
}

export async function createOrcamento(data: OrcamentoData) {
  try {
    const supabase = await createClient()

    // Precisamos do tenant_id do usuário logado
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      return { error: "Usuário não autenticado. Faça login para continuar." }
    }

    let { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', authData.user.id)
      .single()

    // Auto-Healing
    if (!profile?.tenant_id) {
      let { data: tenant } = await supabase.from('tenants').select('id').eq('slug', 'jc2b-matriz').single()
      if (!tenant) {
        const { data: newTenant } = await supabase.from('tenants').insert({ name: 'JC2B Matriz', slug: 'jc2b-matriz' }).select('id').single()
        tenant = newTenant
      }
      if (tenant) {
        await supabase.from('profiles').upsert({ id: authData.user.id, tenant_id: tenant.id, role: 'vendedor' })
        profile = { tenant_id: tenant.id }
      }
    }

    if (!profile?.tenant_id) {
      return { error: "Falha crítica: Tenant não encontrado e não pôde ser criado automaticamente." }
    }

    const tenantId = profile.tenant_id

    // 1. Procurar ou Criar o Cliente (simplificado para o MVP baseando no nome)
    let clienteId = null
    const { data: existingCliente } = await supabase
      .from('clientes')
      .select('id')
      .eq('nome', data.cliente_nome)
      .eq('tenant_id', tenantId)
      .limit(1)
      .single()

    if (existingCliente) {
      clienteId = existingCliente.id
    } else {
      // Cria novo cliente
      const { data: newCliente, error: clientErr } = await supabase
        .from('clientes')
        .insert({ tenant_id: tenantId, nome: data.cliente_nome })
        .select('id')
        .single()
        
      if (clientErr) return { error: "Erro ao criar cliente: " + clientErr.message }
      clienteId = newCliente.id
    }

    // Calcula o valor total
    const valorTotal = data.produtos.reduce((acc, p) => acc + (p.qtde * p.valorUnit), 0)

    // 2. Criar o Pedido (Orçamento)
    const { data: pedido, error: pedidoErr } = await supabase
      .from('pedidos')
      .insert({
        tenant_id: tenantId,
        cliente_id: clienteId,
        valor_total: valorTotal,
        status: 'Pendente' // Pendente = Aguardando aprovação (Orçamento)
      })
      .select('id')
      .single()

    if (pedidoErr || !pedido) return { error: "Erro ao gerar orçamento: " + pedidoErr?.message }
    
    // 3. Opcional: Processar os itens
    for (const item of data.produtos) {
      if (!item.descricao) continue; // Pula itens vazios
      
      // Busca ou cria o produto
      let produtoId = null
      const { data: existingProd } = await supabase
        .from('produtos')
        .select('id')
        .eq('sku', item.codigo)
        .eq('tenant_id', tenantId)
        .limit(1)
        .single()
        
      if (existingProd) {
        produtoId = existingProd.id
      } else {
        const { data: newProd } = await supabase
          .from('produtos')
          .insert({ 
            tenant_id: tenantId, 
            sku: item.codigo,
            nome: item.descricao,
            preco_venda: item.valorUnit
          })
          .select('id')
          .single()
        produtoId = newProd?.id
      }

      // Cria o item do pedido
      if (produtoId) {
        await supabase
          .from('itens_pedido')
          .insert({
            tenant_id: tenantId,
            pedido_id: pedido.id,
            produto_id: produtoId,
            quantidade: item.qtde,
            preco_unitario: item.valorUnit
          })
      }
    }

    revalidatePath("/orcamentos")
    return { success: true }
  } catch (err: any) {
    console.error("Erro interno no servidor:", err)
    return { error: "Ocorreu um erro inesperado no servidor: " + (err.message || String(err)) }
  }
}
