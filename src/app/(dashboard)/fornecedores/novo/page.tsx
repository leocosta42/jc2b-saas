import { getNextFornecedorCode } from "@/app/actions/fornecedores"
import { NovoFornecedorForm } from "./novo-fornecedor-form"

export default async function NovoFornecedorPage() {
  const nextCodigo = await getNextFornecedorCode()
  return <NovoFornecedorForm nextCodigo={nextCodigo} />
}
