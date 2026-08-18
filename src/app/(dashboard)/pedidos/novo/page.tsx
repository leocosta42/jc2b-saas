import { getFormData } from "@/app/actions/vendas"
import { FormularioVenda } from "@/app/components/FormularioVenda"

export default async function NovoPedidoPage() {
  const dados = await getFormData()
  
  return <FormularioVenda tipo="PEDIDO" dadosForm={dados} />
}
