// Server Component — busca os dados do vendedor e passa para o form client
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { EditarVendedorForm } from "./editar-vendedor-form"

export default async function EditarVendedorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vendedor, error } = await supabase
    .from('vendedores')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !vendedor) notFound()

  return <EditarVendedorForm vendedor={vendedor} />
}
