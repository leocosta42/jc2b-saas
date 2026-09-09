"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { clienteSchema } from "./schema"
import { logAudit } from "@/app/lib/audit"

async function getTenantAndRole(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', userId)
    .single()
  return profile || { tenant_id: null, role: null }
}

export async function createCliente(formData: FormData) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user) return { error: "Usuário não autenticado. Faça login para continuar." }

  const profile = await getTenantAndRole(supabase, authData.user.id)
  if (!profile.tenant_id) return { error: "Empresa não encontrada. Execute o script de correção no Supabase." }
  const tenantId = profile.tenant_id

  try {
    const isAdmin = profile.role === 'admin' || profile.role === 'gerente'

    const rawData = {
      codigo: formData.get("codigo") as string,
      nome: formData.get("nome") as string,
      documento: formData.get("documento") as string,
      inscricao: formData.get("inscricao") as string,
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

    const validatedData = clienteSchema.safeParse(rawData)
    if (!validatedData.success) {
      const errorMessage = validatedData.error.issues[0].message
      return { error: errorMessage }
    }
    const { codigo, nome, documento, celular, email, inscricao, cep, rua, numero, complemento, bairro, cidade, estado, bloqueado } = validatedData.data

    // Validar CPF/CNPJ duplicado
    if (documento) {
      const { data: existing } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cpf_cnpj', documento)
        .maybeSingle()

      if (existing) {
        return { error: `CPF/CNPJ já cadastrado para o cliente: "${existing.nome}"` }
      }
    }

    const insertPayload: any = {
      tenant_id: tenantId,
      codigo: rawData.codigo,
      nome,
      cpf_cnpj: documento,
      inscricao: rawData.inscricao,
      celular,
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
      .from('clientes')
      .insert(insertPayload)

    if (error) {
      console.error("Erro ao inserir cliente:", error)
      await logAudit({
        tenantId,
        userId: authData.user.id,
        userEmail: authData.user.email,
        action: 'CREATE',
        resourceType: 'cliente',
        resourceName: nome,
        result: 'error',
        errorMessage: error.message,
      })
      return { error: "Erro no banco de dados: " + error.message }
    }

    await logAudit({
      tenantId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      action: 'CREATE',
      resourceType: 'cliente',
      resourceName: nome,
      changes: {
        after: insertPayload,
      },
      result: 'success',
    })

    revalidatePath("/clientes")
    return { success: true }
  } catch (err: any) {
    await logAudit({
      tenantId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      action: 'CREATE',
      resourceType: 'cliente',
      result: 'error',
      errorMessage: err.message,
    })
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function updateCliente(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user) return { error: "Usuário não autenticado." }

  const profile = await getTenantAndRole(supabase, authData.user.id)
  if (!profile.tenant_id) return { error: "Empresa não encontrada." }
  const tenantId = profile.tenant_id
  const isAdmin = profile.role === 'admin' || profile.role === 'gerente'

  try {
    // Buscar cliente ANTES de atualizar (para auditoria)
    const { data: clienteAntigo } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    const rawData = {
      codigo: formData.get("codigo") as string,
      nome: formData.get("nome") as string,
      documento: formData.get("documento") as string,
      inscricao: formData.get("inscricao") as string,
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

    const validatedData = clienteSchema.safeParse(rawData)
    if (!validatedData.success) {
      const errorMessage = validatedData.error.issues[0].message
      return { error: errorMessage }
    }
    const { codigo, nome, documento, celular, email, inscricao, cep, rua, numero, complemento, bairro, cidade, estado, bloqueado } = validatedData.data

    // Validar CPF/CNPJ duplicado em OUTRO cliente
    if (documento) {
      const { data: existing } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cpf_cnpj', documento)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        return { error: `CPF/CNPJ já cadastrado para o cliente: "${existing.nome}"` }
      }
    }

    const updatePayload: any = {
      codigo, nome, cpf_cnpj: documento, inscricao: rawData.inscricao, celular, email, cep, rua, numero, complemento, bairro, cidade, estado
    }

    if (isAdmin) {
      updatePayload.bloqueado = bloqueado
    }

    const { error } = await supabase
      .from('clientes')
      .update(updatePayload)
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      await logAudit({
        tenantId,
        userId: authData.user.id,
        userEmail: authData.user.email,
        action: 'UPDATE',
        resourceType: 'cliente',
        resourceId: id,
        resourceName: nome,
        result: 'error',
        errorMessage: error.message,
      })
      return { error: "Erro ao atualizar: " + error.message }
    }

    await logAudit({
      tenantId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      action: 'UPDATE',
      resourceType: 'cliente',
      resourceId: id,
      resourceName: nome,
      changes: {
        before: clienteAntigo,
        after: updatePayload,
      },
      result: 'success',
    })

    revalidatePath("/clientes")
    return { success: true }
  } catch (err: any) {
    await logAudit({
      tenantId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      action: 'UPDATE',
      resourceType: 'cliente',
      resourceId: id,
      result: 'error',
      errorMessage: err.message,
    })
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function deleteCliente(id: string) {
  const supabase = await createClient()
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData?.user) return { error: "Usuário não autenticado." }

  const profile = await getTenantAndRole(supabase, authData.user.id)
  if (!profile.tenant_id) return { error: "Empresa não encontrada." }
  const tenantId = profile.tenant_id

  try {
    // Buscar cliente ANTES de deletar (para auditoria)
    const { data: clienteAntigo } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    const { error } = await supabase
      .from('clientes')
      .update({ ativo: false })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      await logAudit({
        tenantId,
        userId: authData.user.id,
        userEmail: authData.user.email,
        action: 'DELETE',
        resourceType: 'cliente',
        resourceId: id,
        resourceName: clienteAntigo?.nome,
        result: 'error',
        errorMessage: error.message,
      })
      return { error: "Erro ao excluir: " + error.message }
    }

    await logAudit({
      tenantId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      action: 'DELETE',
      resourceType: 'cliente',
      resourceId: id,
      resourceName: clienteAntigo?.nome,
      changes: {
        before: clienteAntigo,
        after: { ativo: false },
      },
      result: 'success',
    })

    revalidatePath("/clientes")
    return { success: true }
  } catch (err: any) {
    await logAudit({
      tenantId,
      userId: authData.user.id,
      userEmail: authData.user.email,
      action: 'DELETE',
      resourceType: 'cliente',
      resourceId: id,
      result: 'error',
      errorMessage: err.message,
    })
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function getNextClienteCodigo() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return 'CLI0001'

  const profile = await getTenantAndRole(supabase, authData.user.id)
  if (!profile.tenant_id) return 'CLI0001'
  const tenantId = profile.tenant_id

  const { data, error } = await supabase
    .from('clientes')
    .select('codigo')
    .eq('tenant_id', tenantId)
    .ilike('codigo', 'CLI%')
    .order('codigo', { ascending: false })
    .limit(1)
    .single()

  if (error || !data || !data.codigo) {
    return 'CLI0001'
  }

  const match = data.codigo.match(/CLI(\d+)/i)
  if (match && match[1]) {
    const nextNum = parseInt(match[1], 10) + 1
    return `CLI${String(nextNum).padStart(4, '0')}`
  }

  return 'CLI0001'
}
