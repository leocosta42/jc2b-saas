import { getDocumentoCompleto, getTenantConfigPublico } from "@/app/actions/imprimir"
import { notFound } from "next/navigation"
import { PrintActions } from "./print-actions"

export default async function ImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await getDocumentoCompleto(id)
  const config = res.data ? await getTenantConfigPublico((res.data as any).tenant_id) : null

  if (res.error) {
    return <div className="p-8 text-red-500 font-bold">Erro ao buscar pedido: {res.error}</div>
  }
  if (!res.data) {
    return <div className="p-8 text-red-500 font-bold">Pedido não encontrado no banco de dados.</div>
  }

  const doc = res.data
  const cliente: any = Array.isArray(doc.clientes) ? doc.clientes[0] : (doc.clientes || {})
  const vendedor: any = Array.isArray(doc.vendedores) ? doc.vendedores[0] : (doc.vendedores || {})
  const itens = doc.itens_pedido || []

  const tipo = doc.tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido de Venda'
  const tipoArquivo = doc.tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido'
  const numero = doc.numero_pedido || '0000'

  const dataEmissao = doc.data_emissao ? new Date(doc.data_emissao).toLocaleDateString('pt-BR') : ''
  const dataEntrega = doc.data_entrega ? new Date(doc.data_entrega).toLocaleDateString('pt-BR') : ''

  // Cálculos de totais
  const qtdeTotal = itens.reduce((acc: number, item: any) => acc + (Number(item.quantidade) || 0), 0)
  const valorTotal = itens.reduce((acc: number, item: any) => {
    const qtde = Number(item.quantidade) || 0
    const preco = Number(item.preco_unitario) || 0
    const desc = Number(item.desconto_percentual) || 0
    return acc + (qtde * preco) * (1 - (desc / 100))
  }, 0)
  const pesoTotal = itens.reduce((acc: number, item: any) => {
    const qtde = Number(item.quantidade) || 0
    const pesoUnit = Number(item.produtos?.peso) || 0
    return acc + (pesoUnit * qtde)
  }, 0)

  const itensRender = itens.map((item: any, i: number) => {
    const qtde = Number(item.quantidade) || 0
    const preco = Number(item.preco_unitario) || 0
    const desc = Number(item.desconto_percentual) || 0
    const subtotal = (qtde * preco) * (1 - (desc / 100))


    return (
      <tr key={item.id} className="text-[11px] border-b border-gray-300 h-6">
        <td className="text-center">{i + 1}</td>
        <td className="text-center">{item.produtos?.sku || '-'}</td>
        <td className="text-center">{qtde}</td>
        <td className="text-center">{item.unidade_medida || 'UN'}</td>
        <td className="text-center">{item.produtos?.ncm || '-'}</td>
        <td className="text-left px-2">{item.produtos?.nome || 'Produto não encontrado'}</td>
        <td className="text-right px-2">{preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        <td className="text-center">{desc > 0 ? `${desc}%` : ''}</td>
        <td className="text-right px-2 font-medium">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      </tr>
    )
  })

  // Preencher linhas vazias para manter layout
  const maxLines = 8
  if (itensRender.length < maxLines) {
    for (let i = itensRender.length; i < maxLines; i++) {
      itensRender.push(
        <tr key={`empty-${i}`} className="text-[11px] border-b border-gray-300 h-6">
          <td className="text-center"></td>
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
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
      
      <PrintActions
        id={id}
        numero={numero.toString()}
        tipo={tipo}
        tipoArquivo={tipoArquivo}
        clienteNome={cliente.nome}
        celular={cliente.celular}
      />

      <div className="max-w-[800px] mx-auto bg-white border border-gray-300 print:border-none p-8 relative shadow-lg print:shadow-none">
        
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
          <div className="text-right flex-1 ml-4 flex flex-col items-end">
            {config?.logo_url ? (
              <img src={config.logo_url} alt={config?.name} className="max-h-16 object-contain mb-2" />
            ) : (
              <img src="/logo.png" alt="JC2B Parts" className="max-h-16 object-contain mb-2" />
            )}
            <div className="text-xs text-gray-600 leading-tight text-right">
              {config?.endereco || 'Endereço não configurado'}<br/>
              {config?.telefone && <span>{config.telefone}</span>}
              {config?.telefone && config?.email && <span> | </span>}
              {config?.email && <span>{config.email}</span>}
              {config?.cnpj && <><br/>CNPJ: {config.cnpj}</>}
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
        <div className="border border-black mt-2 flex flex-col">
          <div className="bg-gray-200 border-b border-black text-center font-bold text-xs py-0.5">
            PRODUTOS
          </div>
          <table className="w-full text-xs flex-1">
            <thead>
              <tr className="border-b border-black">
                <th className="font-normal w-8 py-1">Item</th>
                <th className="font-normal w-16 py-1">Código</th>
                <th className="font-normal w-12 py-1">Qtde</th>
                <th className="font-normal w-10 py-1">U.M</th>
                <th className="font-normal w-16 py-1">NCM</th>
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
            <div className="flex justify-between border-b border-gray-300 p-1">
              <span>Peso Total:</span>
              <span className="font-medium">{pesoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 p-1">
              <span>Valor dos Produtos:</span>
              <span className="font-medium">{valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 p-1">
              <span>Frete {doc.tipo_frete ? `(${doc.tipo_frete})` : ''}:</span>
              <span className="font-medium">
                {doc.tipo_frete === 'CIF' 
                  ? 'Por conta do Remetente' 
                  : (Number(doc.valor_frete) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div className="flex justify-between p-1 font-bold text-sm bg-gray-100">
              <span>Valor Total:</span>
              <span>{(valorTotal + (doc.tipo_frete === 'FOB' ? (Number(doc.valor_frete) || 0) : 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
        <div className="mt-8 mb-4 flex justify-center gap-16 text-xs text-center">
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
