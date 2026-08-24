/**
 * ================================================================
 * SCRIPT DE LIMPEZA DE DADOS - JC2B ERP
 * ================================================================
 * Execução: node clear-data.mjs
 * ================================================================
 */

import { createClient } from '@supabase/supabase-js'

// ================================================================
// ⚙️ CONFIGURAÇÃO
// ================================================================
const SUPABASE_URL = 'https://tgttjjwjbsqizfsjzcrm.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndHRqandqYnNxaXpmc2p6Y3JtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzEwMTIzNywiZXhwIjoyMTAyNjc3MjM3fQ.sl9bwSflLfIzfAIRpnnyK-JrQGm4YryO82RFjIOQYBg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

async function getTenantId() {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error('Tenant não encontrado!')
  }
  return data.id
}

async function main() {
  console.log('='.repeat(60))
  console.log('  JC2B ERP — LIMPANDO TODOS OS DADOS IMPORTADOS')
  console.log('='.repeat(60))

  try {
    const tenantId = await getTenantId()
    console.log(`\n🔑 Limpando dados da empresa...`)

    // A ordem é muito importante por causa dos vínculos (chaves estrangeiras)
    const tables = [
      'itens_pedido',
      'pedidos',
      'produtos',
      'clientes',
      'fornecedores',
      'vendedores'
    ]

    for (const table of tables) {
      console.log(`🗑️  Apagando tabela: ${table}...`)
      // .neq('id', '00000000-0000-0000-0000-000000000000') é um truque para deletar TODAS as linhas de uma vez
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('tenant_id', tenantId) // Garantindo que só apaga da nossa empresa
        .neq('id', '00000000-0000-0000-0000-000000000000') 
        
      if (error) {
        console.error(`  ❌ Erro ao apagar ${table}:`, error.message)
      } else {
        console.log(`  ✅ ${table} apagada com sucesso!`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('  ✅ BASE LIMPA COM SUCESSO! Você já pode importar novamente.')
    console.log('='.repeat(60))

  } catch (err) {
    console.error('\n❌ ERRO FATAL:', err.message)
    process.exit(1)
  }
}

main()
