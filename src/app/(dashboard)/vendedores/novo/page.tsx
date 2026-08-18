// Server Component - busca o código no servidor e passa como prop para o formulário client
import { getNextVendedorCode } from "@/app/actions/vendedores"
import { NovoVendedorForm } from "./novo-vendedor-form"

export default async function NovoVendedorPage() {
  const nextCodigo = await getNextVendedorCode()

  return <NovoVendedorForm nextCodigo={nextCodigo} />
}
