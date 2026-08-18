import { getDocumentoCompleto } from "@/app/actions/imprimir"
import { notFound } from "next/navigation"

export default async function ImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await getDocumentoCompleto(id)
  
  if (res.error || !res.data) return notFound()

  const doc = res.data
  const cliente: any = Array.isArray(doc.clientes) ? doc.clientes[0] : (doc.clientes || {})
  const vendedor: any = Array.isArray(doc.vendedores) ? doc.vendedores[0] : (doc.vendedores || {})
  const itens = doc.itens_pedido || []

  const tipo = doc.tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido de Venda'
  const numero = doc.numero_pedido || '0000'

  const dataEmissao = doc.data_emissao ? new Date(doc.data_emissao).toLocaleDateString('pt-BR') : ''
  const dataEntrega = doc.data_entrega ? new Date(doc.data_entrega).toLocaleDateString('pt-BR') : ''

  // Cálculos de totais
  let qtdeTotal = 0
  let valorTotal = 0

  const itensRender = itens.map((item: any, i: number) => {
    const qtde = Number(item.quantidade) || 0
    const preco = Number(item.preco_unitario) || 0
    const desc = Number(item.desconto_percentual) || 0
    const subtotal = (qtde * preco) * (1 - (desc / 100))

    qtdeTotal += qtde
    valorTotal += subtotal

    return (
      <tr key={item.id} className="text-[11px] border-b border-gray-300 h-6">
        <td className="text-center">{i + 1}</td>
        <td className="text-center">{item.produtos?.sku || '-'}</td>
        <td className="text-center">{qtde}</td>
        <td className="text-center">{item.unidade_medida || 'UN'}</td>
        <td className="text-left px-2">{item.produtos?.nome || 'Produto não encontrado'}</td>
        <td className="text-right px-2">{preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        <td className="text-center">{desc > 0 ? `${desc}%` : ''}</td>
        <td className="text-right px-2 font-medium">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      </tr>
    )
  })

  // Preencher linhas vazias para manter layout
  const maxLines = 15
  if (itensRender.length < maxLines) {
    for (let i = itensRender.length; i < maxLines; i++) {
      itensRender.push(
        <tr key={`empty-${i}`} className="text-[11px] border-b border-gray-300 h-6">
          <td className="text-center"></td>
          <td className="text-center"></td>
          <td className="text-center"></td>
          <td className="text-center"></td>
          <td className="text-left px-2"></td>
          <td className="text-right px-2"></td>
          <td className="text-center"></td>
          <td className="text-right px-2"></td>
        </tr>
      )
    }
  }

  return (
    <div className="bg-gray-100 min-h-screen font-sans print:bg-white text-black py-8 print:py-0">
      
      {/* Botão de impressão (não aparece no PDF/impressão final) */}
      <div className="max-w-[800px] mx-auto mb-4 print:hidden text-right">
        <button 
          id="btn-print"
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
          dangerouslySetInnerHTML={{ __html: '&#128424; Imprimir / Salvar PDF' }}
        />
        <button 
          id="btn-close"
          className="ml-2 bg-gray-300 text-black px-6 py-2 rounded shadow hover:bg-gray-400"
        >
          Fechar
        </button>
      </div>

      <div className="max-w-[800px] mx-auto bg-white border border-gray-300 print:border-none p-8 min-h-[1050px] relative shadow-lg print:shadow-none">
        
        {/* Header Superior */}
        <div className="flex justify-between items-start mb-2">
          {/* Caixa Emissão / Entrega */}
          <div className="border border-black w-64 p-2 text-xs">
            <div className="font-bold text-center text-sm border-b border-black pb-1 mb-1">
              {tipo} {numero}
            </div>
            <div className="flex justify-between">
              <span>Data emissão</span>
              <span>{dataEmissao}</span>
            </div>
            <div className="flex justify-between">
              <span>Data entrega</span>
              <span>{dataEntrega}</span>
            </div>
          </div>
          
          {/* Logo / Info Empresa */}
          <div className="text-right flex-1 ml-4">
            <h1 className="text-xl font-bold uppercase tracking-widest text-gray-800">JC2B PARTS</h1>
            <div className="text-xs text-gray-600 mt-1 leading-tight">
              R: Ana Dias Guimarães, 309 - Dois Córregos - Piracicaba/SP<br/>
              (19) 97137-3709<br/>
              vendas.jc2bparts@outlook.com
            </div>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="border border-black mt-2">
          <div className="bg-gray-200 border-b border-black text-center font-bold text-xs py-0.5">
            DADOS DO CLIENTE
          </div>
          <div className="p-2 text-xs leading-relaxed grid grid-cols-12 gap-2">
            <div className="col-span-12">
              <span className="font-semibold">Cód.:</span> {cliente.codigo || '-'} &nbsp;&nbsp;&nbsp; 
              <span className="font-semibold">Nome:</span> {cliente.nome}
            </div>
            <div className="col-span-12">
              <span className="font-semibold">CPF/CNPJ:</span> {cliente.cpf_cnpj || '-'} &nbsp;&nbsp;&nbsp; 
              <span className="font-semibold">Insc.Est:</span> -
            </div>
            <div className="col-span-12">
              <span className="font-semibold">Endereço:</span> {cliente.rua || ''}, {cliente.numero || ''} {cliente.complemento ? `- ${cliente.complemento}` : ''}
            </div>
            <div className="col-span-5">
              <span className="font-semibold">Bairro:</span> {cliente.bairro || '-'}
            </div>
            <div className="col-span-7">
              <span className="font-semibold">Cidade/UF:</span> {cliente.cidade || '-'}/{cliente.estado || '-'}
            </div>
            <div className="col-span-5">
              <span className="font-semibold">CEP:</span> {cliente.cep || '-'}
            </div>
            <div className="col-span-7">
              <span className="font-semibold">Contato:</span> {cliente.celular || '-'}
            </div>
            <div className="col-span-12">
              <span className="font-semibold">E-mail:</span> {cliente.email || '-'}
            </div>
          </div>
        </div>

        {/* Vendedor */}
        <div className="border border-black mt-2 flex text-xs">
          <div className="bg-gray-200 font-bold px-2 py-1 border-r border-black w-24">Vendedor:</div>
          <div className="px-2 py-1 flex-1 font-semibold uppercase">{vendedor.nome || 'Não informado'}</div>
        </div>

        {/* Produtos Tabela */}
        <div className="border border-black mt-2 min-h-[400px]">
          <div className="bg-gray-200 border-b border-black text-center font-bold text-xs py-0.5">
            PRODUTOS
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="font-normal w-8 py-1">Item</th>
                <th className="font-normal w-20 py-1">Código</th>
                <th className="font-normal w-12 py-1">Qtde</th>
                <th className="font-normal w-10 py-1">U.M</th>
                <th className="font-normal text-left px-2 py-1">Descrição</th>
                <th className="font-normal w-20 text-right px-2 py-1">Valor R$ unit.</th>
                <th className="font-normal w-12 py-1">Desc %</th>
                <th className="font-normal w-24 text-right px-2 py-1">Sub total R$</th>
              </tr>
            </thead>
            <tbody>
              {itensRender}
            </tbody>
          </table>
        </div>

        {/* Totais (Semelhante ao PDF - linhas de total separadas) */}
        <div className="flex justify-end mt-2">
          <div className="w-64 border border-black text-xs">
            <div className="bg-gray-200 border-b border-black text-center font-bold py-0.5">
              TOTAIS
            </div>
            <div className="flex justify-between border-b border-gray-300 p-1">
              <span>Qtd Itens:</span>
              <span className="font-medium">{itens.length}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 p-1">
              <span>Qtd Total:</span>
              <span className="font-medium">{qtdeTotal}</span>
            </div>
            <div className="flex justify-between p-1 font-bold text-sm bg-gray-100">
              <span>Valor Total:</span>
              <span>{valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>
        </div>

        {/* Pagamento e Observações */}
        <div className="border border-black mt-2 text-xs">
          <div className="border-b border-black flex">
            <div className="bg-gray-200 font-bold px-2 py-1 border-r border-black w-40">FORMA DE PAGAMENTO:</div>
            <div className="px-2 py-1 flex-1 uppercase">{doc.forma_pagamento || 'A combinar'}</div>
          </div>
          <div className="p-2 min-h-[60px]">
            <span className="font-bold underline">Observações:</span>
            <p className="mt-1 whitespace-pre-wrap">{doc.observacoes || 'Sem observações.'}</p>
          </div>
        </div>

        {/* Assinaturas */}
        <div className="mt-20 flex justify-center gap-16 text-xs text-center">
          <div className="w-64 border-t border-black pt-2">
            Cliente
          </div>
          <div className="w-64 border-t border-black pt-2">
            Vendedor
          </div>
        </div>

        {/* Adiciona um script client-side pequeno para habilitar os botões html básicos */}
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener("DOMContentLoaded", () => {
            const btnPrint = document.getElementById('btn-print');
            if (btnPrint) btnPrint.onclick = () => window.print();
            const btnClose = document.getElementById('btn-close');
            if (btnClose) btnClose.onclick = () => window.close();
          });
        `}} />
      </div>
    </div>
  )
}
