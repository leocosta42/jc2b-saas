"use server"

import { createClient } from "@/lib/supabase/server"

export async function getDocumentoCompleto(id: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return { error: "Não autenticado" }

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authData.user.id).single()
  if (!profile?.tenant_id) return { error: "Empresa não encontrada" }

  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      id,
      numero_pedido,
      tipo,
      data_emissao,
      data_entrega,
      forma_pagamento,
      observacoes,
      desconto_total,
      clientes (
        codigo, nome, cpf_cnpj, rua, numero, complemento, bairro, cidade, estado, cep, celular, email
      ),
      vendedores (
        nome
      ),
      itens_pedido (
        id,
        quantidade,
        preco_unitario,
        desconto_percentual,
        unidade_medida,
        produtos (
          sku, nome
        )
      )
    `)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (error) return { error: error.message }
  return { data }
}
