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

  const tipo = doc.tipo === 'ORCAMENTO' ? 'orcamento' : 'pedido'
  const numero = doc.numero_pedido || '0000'

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${tipo}-${numero}.pdf"`,
    },
  })
}
