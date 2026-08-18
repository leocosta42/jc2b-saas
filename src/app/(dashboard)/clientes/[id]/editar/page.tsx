import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { EditarClienteForm } from "./editar-cliente-form"

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: cliente, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !cliente) notFound()

  return <EditarClienteForm cliente={cliente} />
}
