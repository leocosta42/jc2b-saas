import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import path from 'path'
import { readFileSync } from 'fs'

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 9, fontFamily: 'Helvetica', color: '#000' },
  row: { flexDirection: 'row' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerBox: { width: 190, borderWidth: 1, borderColor: '#000', padding: 6 },
  headerBoxTitle: { fontWeight: 'bold', fontSize: 11, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 4, marginBottom: 4 },
  headerBoxLine: { flexDirection: 'row', justifyContent: 'space-between' },
  empresaBox: { flex: 1, marginLeft: 12, alignItems: 'flex-end' },
  logo: { maxHeight: 48, marginBottom: 6, objectFit: 'contain' },
  empresaInfo: { fontSize: 8, color: '#555', textAlign: 'right', lineHeight: 1.3 },
  section: { borderWidth: 1, borderColor: '#000', marginTop: 6 },
  sectionTitle: { backgroundColor: '#e5e5e5', borderBottomWidth: 1, borderBottomColor: '#000', textAlign: 'center', fontWeight: 'bold', fontSize: 8, paddingVertical: 2 },
  sectionBody: { padding: 6, fontSize: 8, lineHeight: 1.5 },
  bold: { fontWeight: 'bold' },
  vendedorRow: { flexDirection: 'row' },
  vendedorLabel: { backgroundColor: '#e5e5e5', fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 1, borderRightColor: '#000', width: 80, fontSize: 8 },
  vendedorValue: { paddingHorizontal: 6, paddingVertical: 4, flex: 1, fontWeight: 'bold', textTransform: 'uppercase', fontSize: 8 },
  table: { marginTop: 0 },
  tHeadRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingVertical: 3 },
  tRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 3, minHeight: 14 },
  cItem: { width: 22, textAlign: 'center', fontSize: 8 },
  cCodigo: { width: 45, textAlign: 'center', fontSize: 8 },
  cQtde: { width: 32, textAlign: 'center', fontSize: 8 },
  cUm: { width: 26, textAlign: 'center', fontSize: 8 },
  cNcm: { width: 42, textAlign: 'center', fontSize: 8 },
  cDescricao: { flex: 1, textAlign: 'left', paddingHorizontal: 4, fontSize: 8 },
  cValorUnit: { width: 55, textAlign: 'right', paddingHorizontal: 4, fontSize: 8 },
  cDesc: { width: 32, textAlign: 'center', fontSize: 8 },
  cSubtotal: { width: 65, textAlign: 'right', paddingHorizontal: 4, fontSize: 8, fontWeight: 'bold' },
  totaisWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 },
  totaisBox: { width: 190, borderWidth: 1, borderColor: '#000' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ccc', padding: 4, fontSize: 8 },
  totalLineFinal: { flexDirection: 'row', justifyContent: 'space-between', padding: 4, fontSize: 10, fontWeight: 'bold', backgroundColor: '#f0f0f0' },
  pagamentoLabel: { backgroundColor: '#e5e5e5', fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 4, borderRightWidth: 1, borderRightColor: '#000', width: 130, fontSize: 8 },
  pagamentoValue: { paddingHorizontal: 6, paddingVertical: 4, flex: 1, textTransform: 'uppercase', fontSize: 8 },
  obsBox: { padding: 6, minHeight: 40 },
  obsLabel: { fontWeight: 'bold', textDecoration: 'underline', fontSize: 8 },
  obsText: { marginTop: 4, fontSize: 8, lineHeight: 1.4 },
  assinaturas: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginTop: 30 },
  assinaturaBox: { width: 190, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 4, textAlign: 'center', fontSize: 8 },
})

function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// react-pdf trata `src` string como URL e tenta fazer fetch() dela - nao
// funciona para arquivo local no disco, entao le o buffer diretamente.
let logoPadraoBuffer: Buffer | null = null
try {
  logoPadraoBuffer = readFileSync(path.join(process.cwd(), 'public', 'logo-pdf.png'))
} catch {
  logoPadraoBuffer = null
}

export function DocumentoPdf({ doc, config }: { doc: any; config: any }) {
  const cliente = Array.isArray(doc.clientes) ? doc.clientes[0] : (doc.clientes || {})
  const vendedor = Array.isArray(doc.vendedores) ? doc.vendedores[0] : (doc.vendedores || {})
  const itens = doc.itens_pedido || []

  const tipo = doc.tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido de Venda'
  const numero = doc.numero_pedido || '0000'
  const dataEmissao = doc.data_emissao ? new Date(doc.data_emissao).toLocaleDateString('pt-BR') : ''
  const dataEntrega = doc.data_entrega ? new Date(doc.data_entrega).toLocaleDateString('pt-BR') : ''

  const qtdeTotal = itens.reduce((acc: number, item: any) => acc + (Number(item.quantidade) || 0), 0)
  const valorTotal = itens.reduce((acc: number, item: any) => {
    const qtde = Number(item.quantidade) || 0
    const preco = Number(item.preco_unitario) || 0
    const desc = Number(item.desconto_percentual) || 0
    return acc + (qtde * preco) * (1 - desc / 100)
  }, 0)
  const pesoTotal = itens.reduce((acc: number, item: any) => {
    const qtde = Number(item.quantidade) || 0
    const pesoUnit = Number(item.produtos?.peso) || 0
    return acc + pesoUnit * qtde
  }, 0)
  const freteValor = doc.tipo_frete === 'FOB' ? Number(doc.valor_frete) || 0 : 0

  const logoSrc = config?.logo_url || (logoPadraoBuffer ? { data: logoPadraoBuffer, format: 'png' as const } : undefined)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerTop}>
          <View style={styles.headerBox}>
            <Text style={styles.headerBoxTitle}>{tipo} {numero}</Text>
            <View style={styles.headerBoxLine}>
              <Text>Data emissão</Text>
              <Text>{dataEmissao}</Text>
            </View>
            <View style={styles.headerBoxLine}>
              <Text>Data entrega</Text>
              <Text>{dataEntrega}</Text>
            </View>
          </View>
          <View style={styles.empresaBox}>
            {logoSrc && <Image src={logoSrc} style={styles.logo} />}
            <Text style={styles.empresaInfo}>
              {config?.endereco || 'Endereço não configurado'}
              {'\n'}
              {[config?.telefone, config?.email].filter(Boolean).join(' | ')}
              {config?.cnpj ? `\nCNPJ: ${config.cnpj}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DADOS DO CLIENTE</Text>
          <View style={styles.sectionBody}>
            <Text><Text style={styles.bold}>Cód.:</Text> {cliente.codigo || '-'}    <Text style={styles.bold}>Nome:</Text> {cliente.nome}</Text>
            <Text><Text style={styles.bold}>CPF/CNPJ:</Text> {cliente.cpf_cnpj || '-'}</Text>
            <Text><Text style={styles.bold}>Endereço:</Text> {cliente.rua || ''}, {cliente.numero || ''} {cliente.complemento ? `- ${cliente.complemento}` : ''}</Text>
            <Text><Text style={styles.bold}>Bairro:</Text> {cliente.bairro || '-'}    <Text style={styles.bold}>Cidade/UF:</Text> {cliente.cidade || '-'}/{cliente.estado || '-'}</Text>
            <Text><Text style={styles.bold}>CEP:</Text> {cliente.cep || '-'}    <Text style={styles.bold}>Contato:</Text> {cliente.celular || '-'}</Text>
            <Text><Text style={styles.bold}>E-mail:</Text> {cliente.email || '-'}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.vendedorRow]}>
          <Text style={styles.vendedorLabel}>Vendedor:</Text>
          <Text style={styles.vendedorValue}>{vendedor.nome || 'Não informado'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRODUTOS</Text>
          <View style={styles.table}>
            <View style={styles.tHeadRow}>
              <Text style={styles.cItem}>Item</Text>
              <Text style={styles.cCodigo}>Código</Text>
              <Text style={styles.cQtde}>Qtde</Text>
              <Text style={styles.cUm}>U.M</Text>
              <Text style={styles.cNcm}>NCM</Text>
              <Text style={styles.cDescricao}>Descrição</Text>
              <Text style={styles.cValorUnit}>Valor R$ unit.</Text>
              <Text style={styles.cDesc}>Desc %</Text>
              <Text style={styles.cSubtotal}>Sub total R$</Text>
            </View>
            {itens.map((item: any, i: number) => {
              const qtde = Number(item.quantidade) || 0
              const preco = Number(item.preco_unitario) || 0
              const desc = Number(item.desconto_percentual) || 0
              const subtotal = qtde * preco * (1 - desc / 100)
              return (
                <View style={styles.tRow} key={item.id}>
                  <Text style={styles.cItem}>{i + 1}</Text>
                  <Text style={styles.cCodigo}>{item.produtos?.sku || '-'}</Text>
                  <Text style={styles.cQtde}>{qtde}</Text>
                  <Text style={styles.cUm}>{item.unidade_medida || 'UN'}</Text>
                  <Text style={styles.cNcm}>{item.produtos?.ncm || '-'}</Text>
                  <Text style={styles.cDescricao}>{item.produtos?.nome || 'Produto não encontrado'}</Text>
                  <Text style={styles.cValorUnit}>{fmtMoeda(preco)}</Text>
                  <Text style={styles.cDesc}>{desc > 0 ? `${desc}%` : ''}</Text>
                  <Text style={styles.cSubtotal}>{fmtMoeda(subtotal)}</Text>
                </View>
              )
            })}
          </View>
        </View>

        <View style={styles.totaisWrap}>
          <View style={styles.totaisBox}>
            <Text style={styles.sectionTitle}>TOTAIS</Text>
            <View style={styles.totalLine}><Text>Qtd Itens:</Text><Text style={styles.bold}>{itens.length}</Text></View>
            <View style={styles.totalLine}><Text>Qtd Total:</Text><Text style={styles.bold}>{qtdeTotal}</Text></View>
            <View style={styles.totalLine}><Text>Peso Total:</Text><Text style={styles.bold}>{pesoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</Text></View>
            <View style={styles.totalLine}><Text>Valor dos Produtos:</Text><Text style={styles.bold}>{fmtMoeda(valorTotal)}</Text></View>
            <View style={styles.totalLine}>
              <Text>Frete {doc.tipo_frete ? `(${doc.tipo_frete})` : ''}:</Text>
              <Text style={styles.bold}>{doc.tipo_frete === 'CIF' ? 'Por conta do Remetente' : fmtMoeda(freteValor)}</Text>
            </View>
            <View style={styles.totalLineFinal}>
              <Text>Valor Total:</Text>
              <Text>{fmtMoeda(valorTotal + freteValor)}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 6 }]}>
          <View style={[styles.vendedorRow, { borderBottomWidth: 1, borderBottomColor: '#000' }]}>
            <Text style={styles.pagamentoLabel}>FORMA DE PAGAMENTO:</Text>
            <Text style={styles.pagamentoValue}>{doc.forma_pagamento || 'A combinar'}</Text>
          </View>
          <View style={styles.obsBox}>
            <Text style={styles.obsLabel}>Observações:</Text>
            <Text style={styles.obsText}>{doc.observacoes || 'Sem observações.'}</Text>
          </View>
        </View>

        <View style={styles.assinaturas}>
          <Text style={styles.assinaturaBox}>Cliente</Text>
          <Text style={styles.assinaturaBox}>Vendedor</Text>
        </View>
      </Page>
    </Document>
  )
}
