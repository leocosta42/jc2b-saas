# JC2B PARTS - GUIA DE IMPLEMENTAÇÃO

## Começar Aqui ⬇️

Este guia fornece instruções passo-a-passo para implementar as principais melhorias no JC2B PARTS.

---

## TAREFA 1: Corrigir Validação de CPF/CNPJ Duplicado (30 minutos)

### Local do Problema
- Arquivo: `src/app/actions/clientes.ts`
- Linhas problemáticas: 102-108 (update) e 37-48 (create)

### O Problema
O método `.single()` lança erro quando não encontra um resultado. Isso faz com que o código trate "não encontrado" como "existe duplicata", bloqueando a atualização de clientes.

### Passo 1: Corrigir função `createCliente`

**Abrir:** `src/app/actions/clientes.ts`

**Encontrar (linhas 36-48):**
```typescript
// Validar CPF/CNPJ duplicado
if (documento) {
  const { data: existing } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('tenant_id', tenantId)
    .eq('cpf_cnpj', documento)
    .single()

  if (existing) {
    return { error: `CPF/CNPJ já cadastrado para o cliente: "${existing.nome}"` }
  }
}
```

**Substituir por:**
```typescript
// Validar CPF/CNPJ duplicado
if (documento) {
  const { data: existing } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('tenant_id', tenantId)
    .eq('cpf_cnpj', documento)
    .maybeSingle()  // ✅ MUDANÇA: .single() → .maybeSingle()

  if (existing) {
    return { error: `CPF/CNPJ já cadastrado para o cliente: "${existing.nome}"` }
  }
}
```

### Passo 2: Corrigir função `updateCliente`

**Encontrar (linhas 100-113):**
```typescript
// Validar CPF/CNPJ duplicado em OUTRO cliente
if (documento) {
  const { data: existing } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('tenant_id', tenantId)
    .eq('cpf_cnpj', documento)
    .neq('id', id)
    .single()

  if (existing) {
    return { error: `CPF/CNPJ já cadastrado para o cliente: "${existing.nome}"` }
  }
}
```

**Substituir por:**
```typescript
// Validar CPF/CNPJ duplicado em OUTRO cliente
if (documento) {
  const { data: existing } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('tenant_id', tenantId)
    .eq('cpf_cnpj', documento)
    .neq('id', id)
    .maybeSingle()  // ✅ MUDANÇA: .single() → .maybeSingle()

  if (existing) {
    return { error: `CPF/CNPJ já cadastrado para o cliente: "${existing.nome}"` }
  }
}
```

### Passo 3: Repetir em outros arquivos

**Fazer o mesmo em:**
- `src/app/actions/vendedores.ts` (mesmas linhas, mesmas mudanças)
- `src/app/actions/fornecedores.ts` (mesmas linhas, mesmas mudanças)

### Passo 4: Testar

```bash
# Terminal
npm run dev

# Navegador
1. Abrir http://localhost:3000/clientes/novo
2. Criar cliente A com CPF "111.111.111-11"
3. Ir para http://localhost:3000/clientes/[id-do-cliente]/editar
4. Tentar salvar sem mudanças
5. Resultado esperado: Sem erro ✅
```

**Sucesso:** Agora é possível editar clientes sem erros!

---

## TAREFA 2: Implementar Validação com Zod (4-6 horas)

### Passo 1: Adicionar dependência (se não estiver)

```bash
npm list zod
# Se não estiver na lista:
npm install zod
```

✅ Zod já está no package.json!

### Passo 2: Criar arquivo de schemas

**Criar arquivo:** `src/lib/schemas.ts`

**Conteúdo:**
```typescript
import { z } from 'zod';

// Validar CPF/CNPJ (formato simples)
const cpfCnpjRegex = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/0001-\d{2})$/;

// Validar telefone/celular
const telefonRegex = /^(\(\d{2}\) \d{4,5}-\d{4})?$/;

// Validar CEP
const cepRegex = /^(\d{5}-\d{3})?$/;

export const ClienteSchema = z.object({
  nome: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome não pode exceder 100 caracteres')
    .trim(),
  
  cpf_cnpj: z.string()
    .regex(cpfCnpjRegex, 'CPF/CNPJ inválido. Use o formato correto: 000.000.000-00 ou 00.000.000/0001-00')
    .optional()
    .or(z.literal('')),
  
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  celular: z.string()
    .regex(telefonRegex, 'Celular inválido. Use o formato: (11) 99999-9999')
    .optional()
    .or(z.literal('')),
  
  cep: z.string()
    .regex(cepRegex, 'CEP inválido. Use o formato: 12345-678')
    .optional()
    .or(z.literal('')),
  
  rua: z.string()
    .max(100, 'Rua não pode exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  numero: z.string()
    .max(20, 'Número não pode exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  
  complemento: z.string()
    .max(100, 'Complemento não pode exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  bairro: z.string()
    .max(100, 'Bairro não pode exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  cidade: z.string()
    .max(100, 'Cidade não pode exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  estado: z.string()
    .length(2, 'Estado deve ter 2 caracteres (ex: SP)')
    .optional()
    .or(z.literal('')),
});

export const VendedorSchema = ClienteSchema.omit({ cpf_cnpj: true }).extend({
  cpf_cnpj: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF inválido')
    .optional()
    .or(z.literal('')),
  
  comissao_percentual: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Comissão deve ser um número')
    .optional()
    .or(z.literal('0')),
});

export const FornecedorSchema = ClienteSchema;

export type ClienteInput = z.infer<typeof ClienteSchema>;
export type VendedorInput = z.infer<typeof VendedorSchema>;
export type FornecedorInput = z.infer<typeof FornecedorSchema>;
```

### Passo 3: Atualizar ação de Clientes

**Abrir:** `src/app/actions/clientes.ts`

**Adicionar no topo:**
```typescript
import { ClienteSchema } from "@/lib/schemas";
```

**Substituir função `createCliente`:**
```typescript
export async function createCliente(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) return { error: "Usuário não autenticado. Faça login para continuar." }

    const tenantId = await getTenantId(supabase, authData.user.id)
    if (!tenantId) return { error: "Empresa não encontrada. Execute o script de correção no Supabase." }

    // ✅ NOVO: Validar dados
    const validationResult = ClienteSchema.safeParse({
      nome: formData.get("nome"),
      cpf_cnpj: formData.get("documento"),
      email: formData.get("email"),
      celular: formData.get("celular"),
      cep: formData.get("cep"),
      rua: formData.get("rua"),
      numero: formData.get("numero"),
      complemento: formData.get("complemento"),
      bairro: formData.get("bairro"),
      cidade: formData.get("cidade"),
      estado: formData.get("estado"),
    })

    if (!validationResult.success) {
      return { error: "Dados inválidos", errors: validationResult.error.flatten() }
    }

    const dados = validationResult.data

    // Validar CPF/CNPJ duplicado
    if (dados.cpf_cnpj) {
      const { data: existing } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('tenant_id', tenantId)
        .eq('cpf_cnpj', dados.cpf_cnpj)
        .maybeSingle()

      if (existing) {
        return { error: `CPF/CNPJ já cadastrado para o cliente: "${existing.nome}"` }
      }
    }

    const { error } = await supabase
      .from('clientes')
      .insert({
        tenant_id: tenantId,
        nome: dados.nome,
        cpf_cnpj: dados.cpf_cnpj,
        celular: dados.celular,
        email: dados.email,
        cep: dados.cep,
        rua: dados.rua,
        numero: dados.numero,
        complemento: dados.complemento,
        bairro: dados.bairro,
        cidade: dados.cidade,
        estado: dados.estado,
      })

    if (error) {
      console.error("Erro ao inserir cliente:", error)
      return { error: "Erro no banco de dados: " + error.message }
    }

    revalidatePath("/clientes")
    return { success: true }
  } catch (err: any) {
    return { error: "Erro inesperado: " + (err.message || String(err)) }
  }
}
```

### Passo 4: Repetir para Vendedores e Fornecedores

Fazer o mesmo processo para:
- `src/app/actions/vendedores.ts`
- `src/app/actions/fornecedores.ts`

### Passo 5: Testar

```bash
npm run dev

# Testar validações:
1. Tentar criar cliente sem nome → Erro de validação ✅
2. Tentar criar cliente com email inválido → Erro ✅
3. Tentar criar cliente com CPF inválido → Erro ✅
4. Preencher tudo correto → Sucesso ✅
```

---

## TAREFA 3: Adicionar Toast Notifications (2 horas)

### Passo 1: Instalar Sonner

```bash
npm install sonner
```

### Passo 2: Criar Provider

**Criar:** `src/app/providers.tsx`

```typescript
'use client'

import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster 
        position="top-right"
        theme="light"
      />
    </>
  )
}
```

### Passo 3: Usar Provider no Layout

**Abrir:** `src/app/(dashboard)/layout.tsx`

**Adicionar:**
```typescript
import { Providers } from '@/app/providers'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      {/* seu layout aqui */}
    </Providers>
  )
}
```

### Passo 4: Usar em Forms

**Exemplo:** `src/app/(dashboard)/clientes/novo/novo-cliente-form.tsx`

```typescript
'use client'

import { toast } from 'sonner'
import { createCliente } from '@/app/actions/clientes'

export default function NovoClienteForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createCliente(formData)
    
    if (result.error) {
      toast.error(result.error)
    } else if (result.success) {
      toast.success('Cliente criado com sucesso! 🎉')
      // Redirecionar ou limpar form
    }
  }

  return (
    <form action={handleSubmit}>
      {/* seus campos aqui */}
    </form>
  )
}
```

---

## TAREFA 4: Adicionar Índices no Banco (1-2 horas)

### Passo 1: Criar nova migração

**Criar arquivo:** `supabase/migrations/005_add_indexes.sql`

**Conteúdo:**
```sql
-- Índices para performance

-- Chave estrangeira (necessário em todas as tabelas)
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendedores_tenant_id ON vendedores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_tenant_id ON fornecedores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tenant_id ON clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_produtos_tenant_id ON produtos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_tenant_id ON pedidos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_tenant_id ON itens_pedido(tenant_id);

-- Busca por documento (CPF/CNPJ)
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj ON clientes(tenant_id, cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_vendedores_cpf_cnpj ON vendedores(tenant_id, cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cpf_cnpj ON fornecedores(tenant_id, cpf_cnpj);

-- Busca por email
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_vendedores_email ON vendedores(tenant_id, email);

-- Status
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON clientes(tenant_id, status);

-- Data (para relatórios)
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id ON itens_pedido(tenant_id, pedido_id);

-- Busca por nome
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(tenant_id, nome);
CREATE INDEX IF NOT EXISTS idx_vendedores_nome ON vendedores(tenant_id, nome);
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(tenant_id, nome);
CREATE INDEX IF NOT EXISTS idx_produtos_nome ON produtos(tenant_id, nome);
```

### Passo 2: Executar migração

```bash
# No terminal do Supabase
npx supabase migration up

# Ou manualmente no Supabase Dashboard:
# 1. Abrir SQL Editor
# 2. Copiar conteúdo do arquivo 005_add_indexes.sql
# 3. Executar
```

### Passo 3: Verificar performance

```bash
# Abrir Supabase Console
# Ir em: Database → Query Performance Insights
# Verificar se queries ficaram mais rápidas
```

---

## TAREFA 5: Implementar Rate Limiting (2-3 horas)

### Passo 1: Criar middleware de rate limit

**Criar:** `src/lib/rate-limit.ts`

```typescript
const requests = new Map<string, number[]>();

export function isRateLimited(
  identifier: string,
  maxRequests: number = 10,
  timeWindowMs: number = 60000
): boolean {
  const now = Date.now();
  
  // Limpar entradas antigas
  if (requests.has(identifier)) {
    const timestamps = requests.get(identifier)!.filter(t => now - t < timeWindowMs);
    
    if (timestamps.length > 0) {
      requests.set(identifier, timestamps);
    } else {
      requests.delete(identifier);
    }
  }
  
  // Verificar se excedeu limite
  const timestamps = requests.get(identifier) || [];
  if (timestamps.length >= maxRequests) {
    return true;
  }
  
  // Registrar nova requisição
  requests.set(identifier, [...timestamps, now]);
  
  return false;
}

export function getRateLimitRemaining(identifier: string): number {
  const timestamps = requests.get(identifier) || [];
  return Math.max(0, 10 - timestamps.length);
}
```

### Passo 2: Usar em Actions

**Exemplo:** `src/app/actions/clientes.ts`

```typescript
import { isRateLimited } from "@/lib/rate-limit";

export async function createCliente(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    
    // ✅ NOVO: Validar rate limit
    if (isRateLimited(authData?.user?.id || 'anonymous')) {
      return { error: "Muitas requisições. Aguarde um minuto." }
    }

    // ... resto do código
  }
}
```

---

## TAREFA 6: Implementar MFA (TOTP) (4-6 horas)

### Passo 1: Ativar MFA no Supabase

1. Abrir Supabase Dashboard
2. Ir em: Authentication → MFA
3. Ativar "TOTP"
4. Ativar "Phone verification" (opcional)

### Passo 2: Criar componente de setup MFA

**Criar:** `src/app/(dashboard)/configuracoes/mfa-setup.tsx`

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function MFASetup() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  
  const supabase = createClient()
  
  async function handleEnrollMFA() {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })
      
      if (error) throw error
      
      setQrCode(data?.totp?.qr_code || null)
      toast.success('QR Code gerado. Escaneie com seu authenticator.')
    } catch (error: any) {
      toast.error('Erro ao gerar QR code: ' + error.message)
    }
  }
  
  async function handleVerifyMFA(code: string) {
    try {
      setVerifying(true)
      
      const { error } = await supabase.auth.mfa.verify({
        factorId: 'seu-factor-id', // Obter do response anterior
        code,
      })
      
      if (error) throw error
      
      toast.success('MFA ativado com sucesso! 🔒')
      setQrCode(null)
    } catch (error: any) {
      toast.error('Código inválido: ' + error.message)
    } finally {
      setVerifying(false)
    }
  }
  
  return (
    <div className="max-w-md">
      <h2 className="text-2xl font-bold mb-4">Ativar Autenticação em Dois Fatores</h2>
      
      {!qrCode ? (
        <button
          onClick={handleEnrollMFA}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded"
        >
          Gerar QR Code
        </button>
      ) : (
        <div>
          <p className="mb-4">Escaneie este código com seu app de autenticação:</p>
          <img src={qrCode} alt="QR Code" className="mb-4" />
          <input
            type="text"
            placeholder="Código de 6 dígitos"
            maxLength={6}
            pattern="\d{6}"
            onKeyUp={(e) => {
              if (e.currentTarget.value.length === 6) {
                handleVerifyMFA(e.currentTarget.value)
              }
            }}
            className="w-full border px-3 py-2 rounded text-center text-2xl tracking-widest"
          />
        </div>
      )}
    </div>
  )
}
```

---

## TAREFA 7: Criar Tabela de Audit Logs (3-4 horas)

### Passo 1: Criar migração

**Criar arquivo:** `supabase/migrations/006_audit_logs.sql`

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tabela TEXT NOT NULL,
  operacao TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  registro_id UUID,
  dados_antes JSONB,
  dados_depois JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(tenant_id, created_at DESC);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view audit logs in their tenant" ON audit_logs
  FOR SELECT USING (tenant_id = get_user_tenant_id());

-- Trigger para logar mudanças em clientes
CREATE OR REPLACE FUNCTION log_cliente_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    tenant_id, user_id, tabela, operacao, 
    registro_id, dados_antes, dados_depois
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    auth.uid(),
    'clientes',
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS clientes_audit_trigger ON clientes;
CREATE TRIGGER clientes_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clientes
  FOR EACH ROW EXECUTE PROCEDURE log_cliente_changes();

-- Repetir para outras tabelas: vendedores, fornecedores, pedidos, produtos, itens_pedido
```

### Passo 2: Criar página de visualização

**Criar:** `src/app/(dashboard)/configuracoes/audit-logs.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()
  
  useEffect(() => {
    async function loadLogs() {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)
        
        if (error) throw error
        setLogs(data || [])
      } finally {
        setLoading(false)
      }
    }
    
    loadLogs()
  }, [])
  
  if (loading) return <div>Carregando...</div>
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Log de Auditoria</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Data</th>
            <th className="border p-2">Usuário</th>
            <th className="border p-2">Tabela</th>
            <th className="border p-2">Operação</th>
            <th className="border p-2">Detalhes</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id} className="border">
              <td className="border p-2">
                {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
              </td>
              <td className="border p-2">{log.user_id}</td>
              <td className="border p-2">{log.tabela}</td>
              <td className="border p-2">
                <span className={`px-2 py-1 rounded text-white ${
                  log.operacao === 'INSERT' ? 'bg-green-600' :
                  log.operacao === 'UPDATE' ? 'bg-blue-600' :
                  'bg-red-600'
                }`}>
                  {log.operacao}
                </span>
              </td>
              <td className="border p-2 text-sm">
                <button className="text-blue-600 hover:underline">
                  Ver mudanças
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## PRÓXIMOS PASSOS

1. ✅ Completar Tarefa 1-3 esta semana
2. ✅ Completar Tarefa 4-5 na semana 2
3. ✅ Completar Tarefa 6-7 na semana 2
4. ⬜ Implementar Módulo Produtos completo
5. ⬜ Implementar Workflow de Pedidos

---

## Teste Antes de Fazer Deploy

```bash
# Rodar tests (depois criar testes)
npm run test

# Validar build
npm run build

# Verificar erros TypeScript
npm run type-check

# Linter
npm run lint

# Depois: Deploy
npm run deploy
```

---

**Fim do Guia de Implementação**
