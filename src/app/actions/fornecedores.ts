"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { fornecedorSchema } from "./schema"

async function getTenantAndRole(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', userId)
    .single()
  return profile || { tenant_id: null, role: null }
}

export async function createFornecedor(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado. Faça login para continuar." }

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Empresa não encontrada. Execute o script de correção no Supabase." }
    const tenantId = profile.tenant_id
    const isAdmin = profile.role === 'admin' || profile.role === 'gerente'

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
      bloqueado: formData.get("bloqueado") === 'true',
    };

    const validatedData = fornecedorSchema.safeParse(rawData);
    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }
    const { codigo, nome, documento, celular, email, cep, rua, numero, complemento, bairro, cidade, estado, bloqueado } = validatedData.data;

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

    const insertPayload: any = {
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
    }

    if (isAdmin) {
      insertPayload.bloqueado = bloqueado
    }

    const { error } = await supabase
      .from('fornecedores')
      .insert(insertPayload)

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

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Empresa não encontrada." }
    const tenantId = profile.tenant_id
    const isAdmin = profile.role === 'admin' || profile.role === 'gerente'

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
      bloqueado: formData.get("bloqueado") === 'true',
    };

    const validatedData = fornecedorSchema.safeParse(rawData);
    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }
    const { codigo, nome, documento, celular, email, cep, rua, numero, complemento, bairro, cidade, estado, bloqueado } = validatedData.data;

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

    const updatePayload: any = {
      codigo, nome, cnpj_cpf: documento, telefone: celular, email, cep, rua, numero, complemento, bairro, cidade, estado
    }
    
    if (isAdmin) {
      updatePayload.bloqueado = bloqueado
    }

    const { error } = await supabase
      .from('fornecedores')
      .update(updatePayload)
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

    const profile = await getTenantAndRole(supabase, authData.user.id)
    if (!profile.tenant_id) return { error: "Empresa não encontrada." }
    const tenantId = profile.tenant_id

    const { error } = await supabase
      .from('fornecedores')
      .update({ ativo: false })
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

  const profile = await getTenantAndRole(supabase, authData.user.id)
  if (!profile.tenant_id) return "FORN001"
  const tenantId = profile.tenant_id

  const { data } = await supabase
    .from('fornecedores')
    .select('codigo')
    .eq('tenant_id', tenantId)
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
