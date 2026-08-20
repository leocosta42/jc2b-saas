import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function getDocumentoCompleto(id: string) {
  // Criamos um cliente que não depende de cookies/sessão para que o cliente do whatsapp consiga abrir a página
  // Usamos a chave SERVICE_ROLE (se configurada) para ler os dados, ou a padrão.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = createSupabaseClient(supabaseUrl, supabaseKey)

  // Faz a busca direta pelo ID. O ID é um UUID impossível de adivinhar, 
  // servindo como uma "senha" natural para a visualização pública.
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
      valor_frete,
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
    .single()

  if (error) return { error: error.message }
  return { data }
}
