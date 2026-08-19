"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { fornecedorSchema } from "./schema"

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

    const rawData = {
      codigo: formData.get("codigo") as string,
      nome: formData.get("nome") as string,
      documento: formData.get("documento") as string,
      celular: formData.get("celular") as string,
      email: formData.get("email") as string,
      cep: formData.get("cep") as string,
      rua: formData.get("rua") as string,
      numero: formData.get("numero") as string,
      complemento: formData.get("complemento") as string,
      bairro: formData.get("bairro") as string,
      cidade: formData.get("cidade") as string,
      estado: formData.get("estado") as string,
    };

    const validatedData = fornecedorSchema.safeParse(rawData);
    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }
    const { codigo, nome, documento, celular, email, cep, rua, numero, complemento, bairro, cidade, estado } = validatedData.data;

    // Validar CNPJ/CPF duplicado
    if (documento) {
      const { data: existing } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cnpj_cpf', documento)
        .maybeSingle()

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

    const rawData = {
      codigo: formData.get("codigo") as string,
      nome: formData.get("nome") as string,
      documento: formData.get("documento") as string,
      celular: formData.get("celular") as string,
      email: formData.get("email") as string,
      cep: formData.get("cep") as string,
      rua: formData.get("rua") as string,
      numero: formData.get("numero") as string,
      complemento: formData.get("complemento") as string,
      bairro: formData.get("bairro") as string,
      cidade: formData.get("cidade") as string,
      estado: formData.get("estado") as string,
    };

    const validatedData = fornecedorSchema.safeParse(rawData);
    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }
    const { codigo, nome, documento, celular, email, cep, rua, numero, complemento, bairro, cidade, estado } = validatedData.data;

    // Checar duplicado em OUTRO fornecedor
    if (documento) {
      const { data: existing } = await supabase
        .from('fornecedores')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cnpj_cpf', documento)
        .neq('id', id)
        .maybeSingle()

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
