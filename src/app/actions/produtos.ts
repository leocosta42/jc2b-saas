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

export async function createProduto(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada." }

    const codigo = formData.get("codigo") as string
    const descricao = formData.get("descricao") as string
    const um = formData.get("um") as string
    const preco_custo = Number(formData.get("preco_custo")) || 0
    const preco_venda = Number(formData.get("preco_venda")) || 0
    const quantidade_estoque = Number(formData.get("quantidade_estoque")) || 0
    const fornecedor_id = formData.get("fornecedor_id") as string

    if (!descricao) return { error: "A descrição é obrigatória." }

    const { error } = await supabase
      .from('produtos')
      .insert({
        tenant_id: tenantId,
        sku: codigo,
        nome: descricao,
        descricao: um, // Guardando U.M aqui provisoriamente ou podemos usar para unidade
        preco_custo,
        preco_venda,
        quantidade_estoque,
        fornecedor_id: fornecedor_id || null
      })

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
    .order('nome')

  return data || []
}
