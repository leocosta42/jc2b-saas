import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { EditarFornecedorForm } from "./editar-fornecedor-form"

export default async function EditarFornecedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: fornecedor, error } = await supabase
    .from('fornecedores')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !fornecedor) notFound()

  return <EditarFornecedorForm fornecedor={fornecedor} />
}
