import { getFormData, getPedidoCompletoById } from "@/app/actions/vendas"
import { FormularioVenda } from "@/app/components/FormularioVenda"

export default async function NovoPedidoPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams
  const editId = typeof resolvedParams.edit_id === 'string' ? resolvedParams.edit_id : null

  const dados = await getFormData()
  
  let pedidoEdit = null
  if (editId) {
    pedidoEdit = await getPedidoCompletoById(editId)
  }
  
  return <FormularioVenda tipo="PEDIDO" dadosForm={dados} isEdit={!!editId} pedidoEdit={pedidoEdit} />
}
