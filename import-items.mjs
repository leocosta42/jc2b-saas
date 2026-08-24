/**
 * ================================================================
 * SCRIPT DE IMPORTAÇÃO DE ITENS DOS PEDIDOS - JC2B ERP
 * ================================================================
 * Lê cada aba do Excel (cada pedido/orçamento tem sua própria aba)
 * e importa os itens vinculando ao pedido e ao produto correto.
 *
 * Pré-requisito: já ter rodado o import-data.mjs antes!
 *
 * Execução: node import-items.mjs
 * ================================================================
 */

import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// ================================================================
// ⚙️ CONFIGURAÇÃO — mesma chave do import-data.mjs
// ================================================================
const SUPABASE_URL = 'https://tgttjjwjbsqizfsjzcrm.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndHRqandqYnNxaXpmc2p6Y3JtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzEwMTIzNywiZXhwIjoyMTAyNjc3MjM3fQ.sl9bwSflLfIzfAIRpnnyK-JrQGm4YryO82RFjIOQYBg'

// ================================================================
// 📁 Nome do arquivo Excel com todos os pedidos
// Coloque o arquivo .xlsx dentro da pasta imports/
// ================================================================
const EXCEL_FILE = 'planilha.xlsx' // ← altere para o nome do seu arquivo

const __dirname = dirname(fileURLToPath(import.meta.url))
const IMPORTS_DIR = join(__dirname, 'imports')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

// ================================================================
// 📌 UTILITÁRIOS
// ================================================================

function cleanMoney(val) {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return val
  const cleaned = String(val).replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function cleanInt(val) {
  if (val === null || val === undefined || val === '') return 0
  let num
  if (typeof val === 'number') {
    num = Math.round(val)
  } else {
    num = parseInt(String(val).replace(',', '.').trim(), 10)
  }
  if (isNaN(num)) return 0
  if (num > 2147483647) return 2147483647
  if (num < -2147483648) return -2147483648
  return num
}

function cleanPercent(val) {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return val
  const cleaned = String(val).replace('%', '').replace(',', '.').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function cellValue(sheet, cellAddress) {
  const cell = sheet[cellAddress]
  if (!cell) return ''
  return cell.v !== undefined ? String(cell.v).trim() : ''
}

// Converte coluna A=0, B=1, etc.
function colNum(letter) {
  return letter.toUpperCase().charCodeAt(0) - 65
}

function getRowValues(sheet, rowNum, range) {
  const result = {}
  const ref = XLSX.utils.decode_range(range)
  for (let c = ref.s.c; c <= ref.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: rowNum - 1, c })
    const cell = sheet[addr]
    result[c] = cell ? cell.v : ''
  }
  return result
}

// ================================================================
// 🔍 PARSERS DE ESTRUTURA DO EXCEL
// ================================================================

/**
 * Encontra a linha onde ficam os cabeçalhos dos itens
 * Procura pela coluna "Código" ou "Item" nas primeiras 30 linhas
 */
function findItemsHeaderRow(sheet) {
  const range = sheet['!ref']
  if (!range) return -1
  const ref = XLSX.utils.decode_range(range)

  for (let r = 0; r <= Math.min(ref.e.r, 30); r++) {
    for (let c = ref.s.c; c <= Math.min(ref.e.c, 10); c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = sheet[addr]
      if (cell && String(cell.v).trim().toLowerCase() === 'código') {
        return r + 1 // retorna número da linha (1-indexed)
      }
    }
  }
  return -1
}

/**
 * Descobre as colunas dos campos importantes na linha de cabeçalho
 * Retorna: { codigoCol, descricaoCol, qtdeCol, umCol, precoUniCol, descontoCol }
 */
function findColumnMap(sheet, headerRow) {
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  const map = {}

  for (let c = ref.s.c; c <= Math.min(ref.e.c, 15); c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRow - 1, c })
    const cell = sheet[addr]
    if (!cell || !cell.v) continue
    const v = String(cell.v).trim().toLowerCase()

    if (v === 'código' || v === 'codigo') map.codigoCol = c
    else if (v === 'descrição' || v === 'descricao') map.descricaoCol = c
    else if (v === 'qtde' || v === 'qtd' || v === 'quantidade') map.qtdeCol = c
    else if (v === 'u.m' || v === 'um' || v === 'unidade') map.umCol = c
    else if (v.includes('uni') && v.includes('valor')) map.precoUniCol = c
    else if (v.includes('desc') && v.includes('%')) map.descontoCol = c
    else if (v.includes('sub') || v.includes('total')) map.subtotalCol = c
  }

  return map
}

/**
 * Extrai o código do cliente do cabeçalho da aba
 * Procura por "Cód.: CLIxxxx" nas primeiras 15 linhas
 */
function extractClientCode(sheet) {
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')

  for (let r = 0; r <= Math.min(ref.e.r, 15); r++) {
    for (let c = 0; c <= Math.min(ref.e.c, 5); c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = sheet[addr]
      if (!cell || !cell.v) continue
      const val = String(cell.v).trim()

      // Procura "Cód.: CLI0249" ou similar
      const match = val.match(/[Cc][oó][d]\.?\s*:?\s*([A-Z]{2,3}\d+)/i)
      if (match) return match[1].trim()
    }
  }
  return null
}

/**
 * Extrai tipo e número do pedido do cabeçalho
 * Ex: "Orçamento 2107" → { tipo: 'ORCAMENTO', numero: '2107' }
 */
function extractTipoFromSheet(sheet, tabName) {
  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')

  for (let r = 0; r <= Math.min(ref.e.r, 5); r++) {
    for (let c = 0; c <= ref.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c })
      const cell = sheet[addr]
      if (!cell || !cell.v) continue
      const val = String(cell.v).trim().toUpperCase()

      if (val.includes('ORÇAMENTO') || val.includes('ORCAMENTO')) return 'ORCAMENTO'
      if (val.includes('PEDIDO')) return 'PEDIDO'
    }
  }

  return 'PEDIDO' // padrão
}

/**
 * Lê os itens de uma aba de pedido
 */
function extractItems(sheet) {
  const headerRow = findItemsHeaderRow(sheet)
  if (headerRow === -1) return []

  const colMap = findColumnMap(sheet, headerRow)
  if (colMap.codigoCol === undefined) return []

  const ref = XLSX.utils.decode_range(sheet['!ref'] || 'A1')
  const items = []

  // Começa a ler a partir da linha seguinte ao cabeçalho
  for (let r = headerRow; r <= ref.e.r; r++) {
    const codigoAddr = XLSX.utils.encode_cell({ r, c: colMap.codigoCol })
    const codigoCell = sheet[codigoAddr]

    // Pula linha se não tiver código de produto (linha vazia ou decorativa)
    if (!codigoCell || !codigoCell.v) continue
    const sku = String(codigoCell.v).trim()

    // Pula se não parece um SKU válido (deve ter letras e números)
    if (!/[A-Za-z]/.test(sku) || sku.length < 3) continue

    const descricao = colMap.descricaoCol !== undefined
      ? String(sheet[XLSX.utils.encode_cell({ r, c: colMap.descricaoCol })]?.v || '').trim()
      : ''

    const qtde = colMap.qtdeCol !== undefined
      ? cleanInt(sheet[XLSX.utils.encode_cell({ r, c: colMap.qtdeCol })]?.v)
      : 0

    const um = colMap.umCol !== undefined
      ? String(sheet[XLSX.utils.encode_cell({ r, c: colMap.umCol })]?.v || 'UN').trim()
      : 'UN'

    const precoUni = colMap.precoUniCol !== undefined
      ? cleanMoney(sheet[XLSX.utils.encode_cell({ r, c: colMap.precoUniCol })]?.v)
      : 0

    const desconto = colMap.descontoCol !== undefined
      ? cleanPercent(sheet[XLSX.utils.encode_cell({ r, c: colMap.descontoCol })]?.v)
      : 0

    if (qtde === 0 && precoUni === 0) continue // ignora linhas sem dados úteis

    items.push({ sku, descricao, qtde, um, precoUni, desconto })
  }

  return items
}

// ================================================================
// 🚀 LÓGICA PRINCIPAL DE IMPORTAÇÃO
// ================================================================

async function getTenantId() {
  const { data, error } = await supabase.from('tenants').select('id, name').limit(1).single()
  if (error || !data) throw new Error('Tenant não encontrado!')
  console.log(`  ✅ Empresa: "${data.name}"`)
  return data.id
}

async function fetchAll(table, selectStr, tenantId) {
  let allData = []
  let page = 0
  const size = 1000
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(selectStr)
      .eq('tenant_id', tenantId)
      .range(page * size, (page + 1) * size - 1)
    
    if (error) throw new Error(`Erro ao carregar ${table}: ` + error.message)
    if (!data || data.length === 0) break
    
    allData = allData.concat(data)
    if (data.length < size) break
    page++
  }
  return allData
}

/** Carrega todos os pedidos do banco indexados por numero_pedido */
async function loadPedidosMap(tenantId) {
  const data = await fetchAll('pedidos', 'id, numero_pedido, tipo', tenantId)
  const map = {}
  for (const p of data) {
    map[String(p.numero_pedido)] = p.id
  }
  console.log(`  📦 ${Object.keys(map).length} pedidos encontrados no banco`)
  return map
}

/** Carrega todos os produtos indexados por SKU */
async function loadProdutosMap(tenantId) {
  const data = await fetchAll('produtos', 'id, sku, preco_custo', tenantId)
  const map = {}
  for (const p of data) {
    if (p.sku) map[p.sku.trim()] = { id: p.id, custo: p.preco_custo || 0 }
  }
  console.log(`  📦 ${Object.keys(map).length} produtos encontrados no banco`)
  return map
}

async function main() {
  console.log('='.repeat(60))
  console.log('  JC2B ERP — IMPORTAÇÃO DE ITENS DOS PEDIDOS')
  console.log('='.repeat(60))

  if (SUPABASE_SERVICE_KEY === 'COLE_SUA_CHAVE_SERVICE_ROLE_AQUI') {
    console.error('\n❌ Configure a SUPABASE_SERVICE_KEY no script!')
    process.exit(1)
  }

  const xlsxPath = join(IMPORTS_DIR, EXCEL_FILE)
  if (!existsSync(xlsxPath)) {
    console.error(`\n❌ Arquivo não encontrado: ${xlsxPath}`)
    console.error(`   Coloque o arquivo "${EXCEL_FILE}" dentro da pasta imports/`)
    process.exit(1)
  }

  console.log(`\n📂 Lendo arquivo: ${EXCEL_FILE}`)
  const fileBuffer = readFileSync(xlsxPath)
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false, cellText: false })
  const allSheets = workbook.SheetNames
  console.log(`   ${allSheets.length} abas encontradas`)

  // Filtra apenas abas numéricas (ignora "Formulário Pedido", "Clientes", etc.)
  const pedidoSheets = allSheets.filter(name => /^\d+$/.test(name.trim()))
  console.log(`   ${pedidoSheets.length} abas de pedidos/orçamentos identificadas`)

  console.log('\n🔑 Conectando ao banco de dados...')
  const tenantId = await getTenantId()
  const pedidosMap = await loadPedidosMap(tenantId)
  const produtosMap = await loadProdutosMap(tenantId)

  // Estatísticas gerais
  let totalItens = 0
  let totalErros = 0
  let abasSemPedido = 0
  let abasSemItens = 0

  console.log('\n📋 Processando abas...\n')

  const batchInsert = []

  for (const sheetName of pedidoSheets) {
    const numero = sheetName.trim()
    const pedidoId = pedidosMap[numero]

    if (!pedidoId) {
      abasSemPedido++
      // Silencioso — pode ser que o pedido não foi importado ainda
      continue
    }

    const sheet = workbook.Sheets[sheetName]
    const items = extractItems(sheet)

    if (items.length === 0) {
      abasSemItens++
      continue
    }

    let seq = 1
    for (const item of items) {
      const produto = produtosMap[item.sku]
      if (!produto) {
        console.warn(`  ⚠️  Produto não encontrado: SKU "${item.sku}" (pedido ${numero})`)
        totalErros++
        continue
      }

      batchInsert.push({
        tenant_id: tenantId,
        pedido_id: pedidoId,
        produto_id: produto.id,
        quantidade: item.qtde || 1,
        preco_unitario: item.precoUni,
        desconto_percentual: item.desconto || 0,
        unidade_medida: item.um || 'UN',
        valor_custo: produto.custo || 0,
        item_sequencia: seq++,
      })

      totalItens++
    }
  }

  // Inserir em lotes
  console.log(`\n💾 Inserindo ${totalItens} itens no banco...`)
  const BATCH = 100
  let inserted = 0

  for (let i = 0; i < batchInsert.length; i += BATCH) {
    const batch = batchInsert.slice(i, i + BATCH)
    const { error } = await supabase.from('itens_pedido').insert(batch)
    if (error) {
      console.error(`  ❌ Erro no lote ${i}-${i + BATCH}:`, error.message)
      totalErros += batch.length
    } else {
      inserted += batch.length
    }
    process.stdout.write(`\r  Progresso: ${Math.min(i + BATCH, batchInsert.length)}/${batchInsert.length}`)
  }

  console.log('\n')
  console.log('='.repeat(60))
  console.log('  ✅ IMPORTAÇÃO DE ITENS CONCLUÍDA!')
  console.log('='.repeat(60))
  console.log(`  📋 Abas processadas:    ${pedidoSheets.length}`)
  console.log(`  ⚠️  Sem pedido no banco:  ${abasSemPedido} (rode import-data.mjs primeiro)`)
  console.log(`  📭 Abas sem itens:       ${abasSemItens}`)
  console.log(`  ✅ Itens importados:     ${inserted}`)
  console.log(`  ❌ Itens com erro:       ${totalErros}`)
  console.log('='.repeat(60))
}

main()
