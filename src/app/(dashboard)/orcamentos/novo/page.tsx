import { getFormData } from "@/app/actions/vendas"
import { FormularioVenda } from "@/app/components/FormularioVenda"

export default async function NovoOrcamentoPage() {
  const dados = await getFormData()
  
  return <FormularioVenda tipo="ORCAMENTO" dadosForm={dados} />
}
