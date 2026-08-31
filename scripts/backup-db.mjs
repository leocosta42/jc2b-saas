/**
 * ================================================================
 * BACKUP MANUAL DO BANCO (DIY) - JC2B ERP
 * ================================================================
 * Exporta todas as tabelas de negocio para arquivos JSON usando a
 * service_role key (bypassa RLS, entao pega tudo).
 *
 * ATENCAO: o resultado contem dados reais de clientes/fornecedores
 * (CPF/CNPJ, endereco, contato). NUNCA commite a pasta de saida no
 * repositorio publico jc2b-saas - guarde em um lugar privado (seu
 * computador, um bucket privado, ou um repo GitHub privado separado).
 *
 * Execucao: node scripts/backup-db.mjs
 * ================================================================
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

if (existsSync(join(__dirname, '..', '.env.local'))) {
  process.loadEnvFile(join(__dirname, '..', '.env.local'))
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

// Todas as tabelas de negocio (ver supabase/migrations/ para o schema completo)
const TABELAS = [
  'tenants',
  'profiles',
  'vendedores',
  'fornecedores',
  'clientes',
  'produtos',
  'pedidos',
  'itens_pedido',
  'ajustes_estoque',
]

async function baixarTabela(nome) {
  const linhas = []
  const pageSize = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from(nome)
      .select('*')
      .range(from, from + pageSize - 1)

    if (error) throw new Error(`Erro lendo ${nome}: ${error.message}`)
    if (!data || data.length === 0) break

    linhas.push(...data)
    if (data.length < pageSize) break
    from += pageSize
  }

  return linhas
}

async function main() {
  const dataHoje = new Date().toISOString().split('T')[0]
  const pastaSaida = join(__dirname, '..', 'backups', dataHoje)
  mkdirSync(pastaSaida, { recursive: true })

  console.log(`📦 Backup iniciado em ${pastaSaida}\n`)

  for (const tabela of TABELAS) {
    process.stdout.write(`  ${tabela}... `)
    try {
      const linhas = await baixarTabela(tabela)
      writeFileSync(join(pastaSaida, `${tabela}.json`), JSON.stringify(linhas, null, 2))
      console.log(`✅ ${linhas.length} registros`)
    } catch (err) {
      console.log(`❌ ${err.message}`)
    }
  }

  console.log(`\n✅ Backup concluído em: ${pastaSaida}`)
  console.log('⚠️  Lembre-se: mova essa pasta para um lugar PRIVADO. Nunca commite no repositório público.')
}

main()
