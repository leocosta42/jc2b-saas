/**
 * ================================================================
 * SCRIPT DE IMPORTAÇÃO DE INSCRIÇÕES ESTADUAIS - CLIENTES
 * ================================================================
 * Atualiza clientes existentes com o campo de inscrição estadual
 * Execução: node import-inscricoes.mjs --file=caminho/planilha.csv
 * ================================================================
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import XLSX from 'xlsx'

// ================================================================
// ⚙️ CONFIGURAÇÃO
// ================================================================
process.loadEnvFile('.env.local')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

// ================================================================
// 📌 UTILITÁRIOS
// ================================================================

function getFileArg() {
  const arg = process.argv.find(a => a.startsWith('--file='))
  if (!arg) {
    console.error('❌ Uso: node import-inscricoes.mjs --file=caminho/planilha.csv')
    console.error('   ou: node import-inscricoes.mjs --file=caminho/planilha.xlsx')
    process.exit(1)
  }
  return arg.replace('--file=', '').trim()
}

function parseExcel(filePath) {
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet)
}

function parseCsv(filePath) {
  let content
  try {
    content = readFileSync(filePath, 'utf-8')
    if (content.includes('�') || content.includes('C�digo')) {
      content = readFileSync(filePath, 'latin1')
    }
  } catch {
    content = readFileSync(filePath, 'latin1')
  }

  content = content.replace(/^﻿/, '')

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
    console.warn(`⚠️  Arquivo vazio ou sem dados`)
    return []
  }

  const firstLine = lines[0]
  const countSemicolon = (firstLine.match(/;/g) || []).length
  const countComma = (firstLine.match(/,/g) || []).length
  const countTab = (firstLine.match(/\t/g) || []).length
  let separator = ','
  if (countSemicolon > countComma && countSemicolon > countTab) separator = ';'
  else if (countTab > countComma) separator = '\t'

  console.log(`  🔍 Separador detectado: "${separator === '\t' ? 'TAB' : separator}"`)

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

function norm(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

function get(row, ...keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== '') return row[key]
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

// ================================================================
// 📤 IMPORTADOR PRINCIPAL
// ================================================================

async function importInscricoes(tenantId, rows) {
  console.log('\n🟢 Importando Inscrições Estaduais...')

  if (!rows || rows.length === 0) {
    console.error('❌ Nenhum dado para importar')
    return
  }

  // Busca todos os clientes uma única vez para fazer match
  console.log('  🔍 Buscando clientes existentes no banco...')
  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('id, codigo, nome, cpf_cnpj')
    .eq('tenant_id', tenantId)

  if (error || !clientes) {
    throw new Error(`Erro ao buscar clientes: ${error?.message || 'desconhecido'}`)
  }

  console.log(`  📊 ${clientes.length} clientes encontrados no banco`)

  // Cria mapa de clientes para busca rápida
  const clientesMap = {}
  clientes.forEach(c => {
    if (c.codigo) clientesMap[`codigo:${c.codigo}`] = c.id
    if (c.nome) clientesMap[`nome:${c.nome}`] = c.id
    if (c.cpf_cnpj) clientesMap[`cpf:${c.cpf_cnpj}`] = c.id
  })

  // Processa cada linha do arquivo
  let updates = 0
  let notFound = 0
  const updates_batch = []

  for (const r of rows) {
    const codigo = get(r, 'Código', 'Codigo', 'Code', 'Cód')
    const nome = get(r, 'Nome', 'Name', 'Cliente')
    const cpf = get(r, 'CPF/CNPJ', 'CNPJ', 'CPF', 'CNPJ/CPF')
    const inscricao = get(r, 'Inscrição', 'Inscricao', 'Inscrição Estadual', 'IE', 'Insc. Estadual')

    if (!inscricao) {
      console.warn(`  ⚠️  Linha sem inscrição estadual: ${nome || codigo}`)
      continue
    }

    // Tenta encontrar o cliente no banco
    let clienteId = null
    if (codigo) clienteId = clientesMap[`codigo:${codigo}`]
    if (!clienteId && nome) clienteId = clientesMap[`nome:${nome}`]
    if (!clienteId && cpf) clienteId = clientesMap[`cpf:${cpf}`]

    if (!clienteId) {
      notFound++
      if (notFound <= 10) {
        console.warn(`  ⚠️  Cliente não encontrado: "${nome}" (cód: ${codigo}, CNPJ: ${cpf})`)
      }
      continue
    }

    updates_batch.push({
      id: clienteId,
      inscricao: inscricao
    })
    updates++
  }

  if (notFound > 10) {
    console.warn(`  ⚠️  +${notFound - 10} clientes adicionais não encontrados`)
  }

  if (updates === 0) {
    console.warn('❌ Nenhum cliente foi encontrado para atualizar')
    return
  }

  console.log(`  📊 ${updates} atualizações pendentes | ${notFound} clientes não encontrados`)

  // Executa as atualizações em lotes
  const batchSize = 50
  let success = 0
  let errors = 0

  for (let i = 0; i < updates_batch.length; i += batchSize) {
    const batch = updates_batch.slice(i, i + batchSize)

    // Faz update individual de cada cliente
    for (const item of batch) {
      const { error } = await supabase
        .from('clientes')
        .update({ inscricao: item.inscricao })
        .eq('id', item.id)

      if (error) {
        console.error(`  ❌ Erro ao atualizar cliente ${item.id}: ${error.message}`)
        errors++
      } else {
        success++
      }
    }

    process.stdout.write(`\r    Progresso: ${Math.min(i + batchSize, updates_batch.length)}/${updates_batch.length}`)
  }

  console.log(`\n  ✅ ${success} inscrições atualizadas | ❌ ${errors} com erro`)
}

// ================================================================
// 🚀 EXECUÇÃO PRINCIPAL
// ================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('  SAAS-PROJECT — IMPORTAÇÃO DE INSCRIÇÕES ESTADUAIS')
  console.log('='.repeat(60))

  try {
    const filePath = resolve(getFileArg())

    if (!existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`)
      process.exit(1)
    }

    console.log(`\n📂 Lendo arquivo: ${filePath}`)

    let rows
    if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) {
      rows = parseExcel(filePath)
    } else {
      rows = parseCsv(filePath)
    }

    console.log(`  📊 ${rows.length} linhas lidas do arquivo`)

    // Detecta as colunas disponíveis
    if (rows.length > 0) {
      console.log(`  📋 Colunas encontradas: ${Object.keys(rows[0]).join(', ')}`)
    }

    console.log('\n🔑 Buscando dados da empresa...')
    const tenantId = await getTenantId()

    await importInscricoes(tenantId, rows)

    console.log('\n' + '='.repeat(60))
    console.log('  ✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!')
    console.log('='.repeat(60))

  } catch (err) {
    console.error('\n❌ ERRO FATAL:', err.message)
    process.exit(1)
  }
}

main()
