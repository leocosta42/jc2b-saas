// Server Component — renderiza o formulário client
import { getNextClienteCodigo } from "@/app/actions/clientes"
import { NovoClienteForm } from "./novo-cliente-form"

export default async function NovoClientePage() {
  const nextCodigo = await getNextClienteCodigo()
  return <NovoClienteForm nextCodigo={nextCodigo} />
}
