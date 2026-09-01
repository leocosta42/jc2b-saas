import { getDocumentoCompleto, getTenantConfigPublico } from "@/app/actions/imprimir"
import { renderToBuffer } from "@react-pdf/renderer"
import { DocumentoPdf } from "../DocumentoPdf"
import { NextRequest } from "next/server"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await getDocumentoCompleto(id)

  if (res.error || !res.data) {
    return new Response(res.error || "Documento não encontrado.", { status: 404 })
  }

  const doc = res.data as any
  const config = await getTenantConfigPublico(doc.tenant_id)

  const buffer = await renderToBuffer(<DocumentoPdf doc={doc} config={config} />)

  const tipoLabel = doc.tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido'
  const numero = doc.numero_pedido || '0000'
  const cliente = Array.isArray(doc.clientes) ? doc.clientes[0] : (doc.clientes || {})
  const nomeArquivo = `${tipoLabel} - ${numero}${cliente?.nome ? ` - ${cliente.nome}` : ''}.pdf`
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
  const nomeArquivoAscii = nomeArquivo.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '_')

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomeArquivoAscii}"; filename*=UTF-8''${encodeURIComponent(nomeArquivo)}`,
    },
  })
}
