"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function createFornecedor(formData: FormData) {
  try {
    const supabase = await createClient()

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

    const codigo = formData.get("codigo") as string
    const nome = formData.get("nome") as string
    const cnpj_cpf = formData.get("documento") as string
    const telefone = formData.get("celular") as string
    const email = formData.get("email") as string

    const { error } = await supabase
      .from('fornecedores')
      .insert({
        tenant_id: profile.tenant_id,
        codigo,
        nome,
        cnpj_cpf,
        telefone,
        email
      })

    if (error) {
      console.error("Erro ao inserir fornecedor:", error)
      return { error: "Erro no banco de dados: " + error.message }
    }

    revalidatePath("/fornecedores")
    return { success: true }
  } catch (err: any) {
    console.error("Erro interno no servidor:", err)
    return { error: "Ocorreu um erro inesperado no servidor: " + (err.message || String(err)) }
  }
}
