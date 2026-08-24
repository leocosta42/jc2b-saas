/**
 * ================================================================
 * SCRIPT DE IMPORTAÇÃO DE DADOS - JC2B ERP
 * ================================================================
 * Execução: node import-data.mjs
 * ================================================================
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ================================================================
// ⚙️ CONFIGURAÇÃO — Substitua a chave service_role abaixo
// Acesse: Supabase > Settings > API > service_role key
// ================================================================
const SUPABASE_URL = 'https://tgttjjwjbsqizfsjzcrm.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndHRqandqYnNxaXpmc2p6Y3JtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzEwMTIzNywiZXhwIjoyMTAyNjc3MjM3fQ.sl9bwSflLfIzfAIRpnnyK-JrQGm4YryO82RFjIOQYBg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMPORTS_DIR = join(__dirname, 'imports')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

// ================================================================
// 📌 UTILITÁRIOS
// ================================================================

function parseCsv(filePath) {
  if (!existsSync(filePath)) {
    console.warn(`  ⚠️  Arquivo não encontrado: ${filePath}. Pulando...`)
    return null
  }

  // Tenta UTF-8 primeiro; se tiver caracteres inválidos, tenta latin1
  let content
  try {
    content = readFileSync(filePath, 'utf-8')
    // Detecta se o encoding está errado (ex: BOM ou caracteres corrompidos)
    if (content.includes('\uFFFD') || content.includes('C\uFFFDdigo')) {
      content = readFileSync(filePath, 'latin1')
    }
  } catch {
    content = readFileSync(filePath, 'latin1')
  }

  // Remove BOM se houver
  content = content.replace(/^\uFEFF/, '')

  // Remove quebras de linha dentro de aspas duplas (Excel exporta assim às vezes)
  let inQuotes = false
  let normalizedContent = ''
  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    if (char === '"') inQuotes = !inQuotes
    if ((char === '\n' || char === '\r') && inQuotes) {
      normalizedContent += ' '
    } else {
      normalizedContent += char
    }
  }

  const lines = normalizedContent.split(/\r?\n/).filter(l => l.trim() !== '')

  if (lines.length < 2) {
    console.warn(`  ⚠️  Arquivo vazio ou sem dados: ${filePath}`)
    return []
  }

  // Detecta o separador automaticamente (vírgula, ponto-e-vírgula ou tab)
  const firstLine = lines[0]
  const countSemicolon = (firstLine.match(/;/g) || []).length
  const countComma = (firstLine.match(/,/g) || []).length
  const countTab = (firstLine.match(/\t/g) || []).length
  let separator = ','
  if (countSemicolon > countComma && countSemicolon > countTab) separator = ';'
  else if (countTab > countComma) separator = '\t'

  console.log(`  🔍 Separador detectado: "${separator === '\t' ? 'TAB' : separator}" | Encoding: ${content.includes('Ã') ? 'possível problema' : 'ok'}`)

  const headers = parseCsvLine(firstLine, separator)

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], separator)
    if (values.length === 0 || values.every(v => v === '')) continue
    const row = {}
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || '').trim()
    })
    rows.push(row)
  }

  return rows
}

function parseCsvLine(line, separator = ',') {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if ((char === separator || (separator === ',' && char === '\t')) && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function cleanMoney(val) {
  if (!val) return 0
  // Remove R$, espaços, pontos de milhar, troca vírgula por ponto
  const cleaned = val.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function cleanPercent(val) {
  if (!val) return 0
  const cleaned = val.replace('%', '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function cleanInt(val) {
  if (!val) return 0
  const cleaned = val.replace(',', '.').trim()
  const num = parseInt(cleaned, 10)
  if (isNaN(num)) return 0
  // Evita erro de 'out of range for type integer' no PostgreSQL
  if (num > 2147483647) return 2147483647
  if (num < -2147483648) return -2147483648
  return num
}

function cleanDate(val) {
  if (!val || val.trim() === '') return null
  // Suporta dd/mm/yyyy e yyyy-mm-dd
  const parts = val.trim().split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return val.trim() || null
}

// Normaliza a chave removendo acentos e colocando em lowercase
// Ex: "C\u00f3digo" e "Codigo" e "C\uFFFDdigo" viram a mesma coisa
function norm(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-zA-Z0-9]/g, '') // remove spaces, symbols, everything except alphanumeric
    .toLowerCase()
}

// Busca um valor no row pelo nome da coluna, tentando variantes com e sem acento
function get(row, ...keys) {
  for (const key of keys) {
    // Tenta exato
    if (row[key] !== undefined && row[key] !== '') return row[key]
    // Tenta normalizado
    const normKey = norm(key)
    for (const rowKey of Object.keys(row)) {
      if (norm(rowKey) === normKey && row[rowKey] !== '') return row[rowKey]
    }
  }
  return ''
}

async function getTenantId() {
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error('Tenant não encontrado! Verifique se o Supabase está configurado corretamente.')
  }

  console.log(`  ✅ Empresa encontrada: "${data.name}" (${data.id})`)
  return data.id
}

// Inserção em lotes para evitar timeout
async function insertInBatches(table, rows, batchSize = 50) {
  let success = 0
  let errors = 0

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const { error } = await supabase.from(table).insert(batch)
    if (error) {
      console.error(`    ❌ Erro no lote ${i}-${i + batchSize}:`, error.message)
      errors += batch.length
    } else {
      success += batch.length
    }
    process.stdout.write(`\r    Progresso: ${Math.min(i + batchSize, rows.length)}/${rows.length}`)
  }

  console.log(`\n    ✅ ${success} inseridos | ❌ ${errors} com erro`)
  return { success, errors }
}

// ================================================================
// 📤 IMPORTADORES POR ENTIDADE
// ================================================================

async function importVendedores(tenantId) {
  console.log('\n🔵 Importando Vendedores...')
  const rows = parseCsv(join(IMPORTS_DIR, 'vendedores.csv'))
  if (!rows || rows.length === 0) return {}

  const vendedoresMap = {} // codigo → id

  const toInsert = rows.map(r => ({
    tenant_id: tenantId,
    codigo: get(r, 'Código', 'Codigo') || null,
    nome: get(r, 'Nome'),
    cpf_cnpj: get(r, 'CPF/CNPJ') || null,
    rua: get(r, 'Rua, Nº', 'Rua, No', 'Rua') || null,
    bairro: get(r, 'Bairro') || null,
    cep: get(r, 'CEP') || null,
    complemento: get(r, 'Complemento') || null,
    cidade: get(r, 'Cidade') || null,
    estado: get(r, 'Estado') || null,
    telefone: get(r, 'Celular', 'Telefone') || null,
    email: get(r, 'E-mail', 'Email') || null,
    comissao_percentual: cleanPercent(get(r, 'Comissão', 'Comissao') || '0'),
    status: 'Ativo'
  })).filter(r => r.nome)

  console.log(`  📊 ${toInsert.length} vendedores a importar`)

  // Inserir um por um para capturar os IDs gerados
  for (const v of toInsert) {
    const { data, error } = await supabase.from('vendedores').insert(v).select('id, codigo').single()
    if (error) {
      console.error(`  ❌ Erro ao inserir vendedor "${v.nome}":`, error.message)
    } else if (data) {
      vendedoresMap[v.codigo] = data.id
      vendedoresMap[v.nome] = data.id // também mapeia por nome (fallback)
      console.log(`  ✅ Vendedor: ${v.nome}`)
    }
  }

  console.log(`  ✅ ${Object.keys(vendedoresMap).length / 2} vendedores importados`)
  return vendedoresMap
}

async function importFornecedores(tenantId) {
  console.log('\n🟠 Importando Fornecedores...')
  const rows = parseCsv(join(IMPORTS_DIR, 'fornecedores.csv'))
  if (!rows || rows.length === 0) return {}

  const fornecedoresMap = {} // codigo → id

  const toInsert = rows.map(r => ({
    tenant_id: tenantId,
    codigo: get(r, 'Código', 'Codigo') || null,
    nome: get(r, 'Nome'),
    cnpj_cpf: get(r, 'CPF/CNPJ', 'CNPJ') || null,
    rua: get(r, 'Rua, Nº', 'Rua, No', 'Rua') || null,
    bairro: get(r, 'Bairro') || null,
    cep: get(r, 'CEP') || null,
    complemento: get(r, 'Complemento') || null,
    cidade: get(r, 'Cidade') || null,
    estado: get(r, 'Estado') || null,
    telefone: get(r, 'Celular', 'Telefone') || null,
    email: get(r, 'E-mail', 'Email') || null,
    status: 'Ativo'
  })).filter(r => r.nome)

  console.log(`  📊 ${toInsert.length} fornecedores a importar`)

  for (const f of toInsert) {
    const { data, error } = await supabase.from('fornecedores').insert(f).select('id, codigo').single()
    if (error) {
      console.error(`  ❌ Erro ao inserir fornecedor "${f.nome}":`, error.message)
    } else if (data) {
      fornecedoresMap[f.codigo] = data.id
      fornecedoresMap[f.nome] = data.id
      console.log(`  ✅ Fornecedor: ${f.nome}`)
    }
  }

  console.log(`  ✅ ${Object.keys(fornecedoresMap).length / 2} fornecedores importados`)
  return fornecedoresMap
}

async function importClientes(tenantId) {
  console.log('\n🟢 Importando Clientes...')
  const rows = parseCsv(join(IMPORTS_DIR, 'clientes.csv'))
  if (!rows || rows.length === 0) return {}

  const clientesMap = {} // codigo → id

  const toInsert = rows.map(r => ({
    tenant_id: tenantId,
    codigo: get(r, 'Código', 'Codigo') || null,
    nome: get(r, 'Nome'),
    cpf_cnpj: get(r, 'CPF/CNPJ') || null,
    rua: get(r, 'Rua, Nº', 'Rua, No', 'Rua') || null,
    bairro: get(r, 'Bairro') || null,
    cep: get(r, 'CEP') || null,
    complemento: get(r, 'Complemento (Casa, Ap.)', 'Complemento') || null,
    cidade: get(r, 'Cidade') || null,
    estado: get(r, 'Estado') || null,
    celular: get(r, 'Celular', 'Telefone') || null,
    email: get(r, 'E-mail', 'Email') || null,
    status: 'Ativo'
  })).filter(r => r.nome)

  console.log(`  📊 ${toInsert.length} clientes a importar`)

  // Clientes em lotes
  const batchSize = 50
  const ids = []
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize)
    const { data, error } = await supabase.from('clientes').insert(batch).select('id, codigo, nome')
    if (error) {
      console.error(`  ❌ Erro no lote ${i}-${i + batchSize}:`, error.message)
    } else if (data) {
      data.forEach(c => {
        if (c.codigo) clientesMap[c.codigo] = c.id
        clientesMap[c.nome] = c.id // fallback por nome
        ids.push(c.id)
      })
    }
    process.stdout.write(`\r    Progresso: ${Math.min(i + batchSize, toInsert.length)}/${toInsert.length}`)
  }

  console.log(`\n  ✅ ${ids.length} clientes importados`)
  return clientesMap
}

async function importProdutos(tenantId, fornecedoresMap) {
  console.log('\n🔷 Importando Produtos...')
  const rows = parseCsv(join(IMPORTS_DIR, 'produtos.csv'))
  if (!rows || rows.length === 0) return {}

  const produtosMap = {} // sku → id

  const toInsert = rows.map(r => {
    const codForn = get(r, 'Cód Forn.', 'Cód. Forn.', 'CodForn', 'Cod Forn') || null
    const nomeForn = get(r, 'Fornecedor') || null
    const fornecedorId = (codForn && fornecedoresMap[codForn])
      || (nomeForn && fornecedoresMap[nomeForn])
      || null

    return {
      tenant_id: tenantId,
      sku: get(r, 'Código', 'Codigo') || null,
      nome: get(r, 'Descrição', 'Descricao', 'Nome') || 'SEM DESCRIÇÃO',
      descricao: get(r, 'U.M', 'UM', 'Unidade') || 'UN',
      um: get(r, 'U.M', 'UM', 'Unidade') || 'UN',
      preco_custo: cleanMoney(get(r, 'Valor custo R$', 'Valor Custo') || '0'),
      preco_venda: cleanMoney(get(r, 'Valor venda R$', 'Valor Venda') || '0'),
      quantidade_estoque: cleanInt(get(r, 'Saldo estoque', 'Saldo Estoque', 'Quantidade') || '0'),
      fornecedor_id: fornecedorId,
      status: 'Ativo'
    }
  }).filter(r => r.nome && r.nome !== 'SEM DESCRIÇÃO')

  console.log(`  📊 ${toInsert.length} produtos a importar`)

  const batchSize = 50
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize)
    const { data, error } = await supabase.from('produtos').insert(batch).select('id, sku')
    if (error) {
      console.error(`  ❌ Erro no lote ${i}-${i + batchSize}:`, error.message)
    } else if (data) {
      data.forEach(p => {
        if (p.sku) produtosMap[p.sku] = p.id
      })
    }
    process.stdout.write(`\r    Progresso: ${Math.min(i + batchSize, toInsert.length)}/${toInsert.length}`)
  }

  console.log(`\n  ✅ ${Object.keys(produtosMap).length} produtos importados`)
  return produtosMap
}

async function importPedidos(tenantId, clientesMap, vendedoresMap) {
  console.log('\n🟡 Importando Pedidos...')
  const rows = parseCsv(join(IMPORTS_DIR, 'pedidos.csv'))
  if (!rows || rows.length === 0) return

  let skipped = 0
  const toInsert = []

  for (const r of rows) {
    const codCliente = r['Cód Cliente'] || r['Cod Cliente'] || null
    const nomeCliente = r['Cliente'] || null
    const codVendedor = r['Cód. Vendedor'] || r['Cód Vendedor'] || r['Cod Vendedor'] || null
    const nomeVendedor = r['Vendedor'] || null

    const clienteId = (codCliente && clientesMap[codCliente])
      || (nomeCliente && clientesMap[nomeCliente])
      || null

    const vendedorId = (codVendedor && vendedoresMap[codVendedor])
      || (nomeVendedor && vendedoresMap[nomeVendedor])
      || null

    if (!clienteId) {
      skipped++
      if (skipped <= 5) {
        console.warn(`  ⚠️  Cliente não encontrado: "${nomeCliente}" (cód: ${codCliente}) — pedido pulado`)
      }
      continue
    }

    const tipo = (r['Tipo'] || 'PEDIDO').toUpperCase().includes('ORC') ? 'ORCAMENTO' : 'PEDIDO'

    toInsert.push({
      tenant_id: tenantId,
      numero_pedido: cleanInt(get(r, 'Número', 'Numero', 'Pedido')),
      cliente_id: clienteId,
      vendedor_id: vendedorId,
      tipo,
      valor_total: cleanMoney(get(r, 'Valor total', 'Valor Total') || '0'),
      data_emissao: cleanDate(get(r, 'Data emissão', 'Data Emissao') || null),
      data_entrega: cleanDate(get(r, 'Data entrega', 'Data Entrega') || null),
      comissao_percentual: cleanPercent(get(r, 'Comissão', 'Comissao') || '0'),
      comissao_rs: cleanMoney(get(r, 'Comissão venda', 'Comissao venda') || '0'),
      mes: get(r, 'mês', 'Mes') || null,
      status: 'Aprovado',
    })
  }

  console.log(`  📊 ${toInsert.length} pedidos a importar | ${skipped} pulados (cliente não encontrado)`)

  const batchSize = 50
  let success = 0
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize)
    const { error } = await supabase.from('pedidos').insert(batch)
    if (error) {
      console.error(`  ❌ Erro no lote ${i}-${i + batchSize}:`, error.message)
    } else {
      success += batch.length
    }
    process.stdout.write(`\r    Progresso: ${Math.min(i + batchSize, toInsert.length)}/${toInsert.length}`)
  }

  console.log(`\n  ✅ ${success} pedidos importados | ⚠️  ${skipped} pulados`)
}

// ================================================================
// 🚀 EXECUÇÃO PRINCIPAL
// ================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('  JC2B ERP — SCRIPT DE IMPORTAÇÃO DE DADOS')
  console.log('='.repeat(60))

  // Validar chave
  if (SUPABASE_SERVICE_KEY === 'COLE_SUA_CHAVE_SERVICE_ROLE_AQUI') {
    console.error('\n❌ ERRO: Você precisa configurar a SUPABASE_SERVICE_KEY no script!')
    console.error('   Acesse: Supabase > Settings > API > service_role key\n')
    process.exit(1)
  }

  try {
    console.log('\n🔑 Buscando dados da empresa...')
    const tenantId = await getTenantId()

    // Importa na ordem correta (dependências primeiro)
    const vendedoresMap = await importVendedores(tenantId)
    const fornecedoresMap = await importFornecedores(tenantId)
    const clientesMap = await importClientes(tenantId)
    await importProdutos(tenantId, fornecedoresMap)
    await importPedidos(tenantId, clientesMap, vendedoresMap)

    console.log('\n' + '='.repeat(60))
    console.log('  ✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!')
    console.log('='.repeat(60))

  } catch (err) {
    console.error('\n❌ ERRO FATAL:', err.message)
    process.exit(1)
  }
}

main()
