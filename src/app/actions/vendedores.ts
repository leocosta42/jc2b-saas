"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { vendedorSchema } from "./schema"

export async function createVendedor(formData: FormData) {
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

    // Sistema de Auto-Cura (Auto-Healing) caso o Trigger do Banco falhe ou não tenha sido rodado
    if (!profile?.tenant_id) {
      console.log("Perfil não encontrado. Tentando auto-cura...")
      
      // 1. Acha ou cria a empresa principal
      let { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', 'jc2b-matriz')
        .single()
        
      if (!tenant) {
        const { data: newTenant } = await supabase
          .from('tenants')
          .insert({ name: 'JC2B Matriz', slug: 'jc2b-matriz' })
          .select('id')
          .single()
        tenant = newTenant
      }

      if (tenant) {
        // 2. Cria o perfil do usuário na empresa
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            tenant_id: tenant.id,
            full_name: authData.user.email?.split('@')[0] || 'Usuario',
            role: 'vendedor'
          })
          
        profile = { tenant_id: tenant.id }
      }
    }

    if (!profile?.tenant_id) {
      return { error: "Falha crítica: Tenant não encontrado e não pôde ser criado automaticamente." }
    }

    const rawData = {
      codigo: formData.get("codigo") as string,
      nome: formData.get("nome") as string,
      telefone: formData.get("telefone") as string,
      email: formData.get("email") as string,
      documento: formData.get("documento") as string,
      comissao_percentual: formData.get("comissao_percentual") as string,
    };

    const validatedData = vendedorSchema.safeParse(rawData);
    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }
    const { codigo, nome, telefone, email, documento, comissao_percentual } = validatedData.data;
    const comissao = parseFloat(comissao_percentual || "0");
    
    // Validar se CPF já existe
    if (documento) {
      const { data: existingDoc } = await supabase
        .from('vendedores')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('cpf_cnpj', documento)
        .maybeSingle()
        
      if (existingDoc) {
        return { error: "Este CPF/CNPJ já está cadastrado para outro vendedor." }
      }
    }

    const { error } = await supabase
      .from('vendedores')
      .insert({
        tenant_id: profile.tenant_id,
        codigo,
        nome,
        telefone,
        email,
        cpf_cnpj: documento,
        comissao_percentual: comissao
      })

    if (error) {
      console.error("Erro ao inserir vendedor:", error)
      return { error: "Erro no banco de dados: " + error.message }
    }

    revalidatePath("/vendedores")
    return { success: true }
  } catch (err: any) {
    console.error("Erro interno no servidor:", err)
    return { error: "Ocorreu um erro inesperado no servidor: " + (err.message || String(err)) }
  }
}

export async function getNextVendedorCode() {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData?.user) return "VEN001"

  const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authData.user.id).single()
  if (!profile?.tenant_id) return "VEN001"

  const { data, error } = await supabase
    .from('vendedores')
    .select('codigo')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0 || !data[0].codigo) {
    return "VEN001"
  }

  const lastCode = data[0].codigo // Ex: VEN002
  const match = lastCode.match(/^VEN(\d+)$/)
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1
    return `VEN${nextNum.toString().padStart(3, '0')}` // VEN003
  }
  
  return "VEN001"
}

export async function updateVendedor(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authData.user.id).single()
    if (!profile?.tenant_id) return { error: "Tenant não encontrado." }

    const rawData = {
      codigo: formData.get("codigo") as string,
      nome: formData.get("nome") as string,
      telefone: formData.get("telefone") as string,
      email: formData.get("email") as string,
      documento: formData.get("documento") as string,
      comissao_percentual: formData.get("comissao_percentual") as string,
    };

    const validatedData = vendedorSchema.safeParse(rawData);
    if (!validatedData.success) {
      return { error: validatedData.error.issues[0].message };
    }
    const { codigo, nome, telefone, email, documento, comissao_percentual } = validatedData.data;
    const comissao = parseFloat(comissao_percentual || "0");

    // Checar se CPF já existe em OUTRO vendedor
    if (documento) {
      const { data: existingDoc } = await supabase
        .from('vendedores').select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('cpf_cnpj', documento)
        .neq('id', id)
        .maybeSingle()
      if (existingDoc) return { error: "Este CPF/CNPJ já está cadastrado para outro vendedor." }
    }

    const { error } = await supabase
      .from('vendedores')
      .update({ codigo, nome, telefone, email, cpf_cnpj: documento, comissao_percentual: comissao })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) return { error: "Erro ao atualizar: " + error.message }

    revalidatePath("/vendedores")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}

export async function deleteVendedor(id: string) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado." }

    const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authData.user.id).single()
    if (!profile?.tenant_id) return { error: "Tenant não encontrado." }

    const { error } = await supabase
      .from('vendedores')
      .update({ ativo: false })
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) return { error: "Erro ao excluir: " + error.message }

    revalidatePath("/vendedores")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}
