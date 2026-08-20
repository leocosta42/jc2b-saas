import { ClientesTable, Cliente } from "./clientes-table"
import { createClient } from "@/lib/supabase/server"
import { Users, Plus } from "lucide-react"
import Link from "next/link"

const mockClientes: Cliente[] = [
  {
    id: "c1",
    nome: "João da Silva",
    cpf_cnpj: "111.111.111-11",
    celular: "(11) 99999-9999",
    email: "joao@email.com",
    cidade: "São Paulo",
    estado: "SP",
    status: "Ativo"
  },
  {
    id: "c2",
    nome: "Maria Oliveira ME",
    cpf_cnpj: "22.222.222/0001-22",
    celular: "(21) 98888-8888",
    email: "contato@mariaoliveira.com.br",
    cidade: "Rio de Janeiro",
    estado: "RJ",
    status: "Ativo"
  }
]

import { Pagination } from '@/app/components/Pagination'

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedParams = await searchParams
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : ''
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1
  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  let clientes: Cliente[] = []
  let totalPages = 1
  let totalCount = 0

  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    
    if (authData?.user) {
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authData.user.id).single()
      
      if (profile?.tenant_id) {
        let query = supabase
          .from('clientes')
          .select('*', { count: 'exact' })
          .eq('tenant_id', profile.tenant_id)
          .eq('ativo', true)
          
        if (q) {
          query = query.or(`nome.ilike.%${q}%,documento.ilike.%${q}%,codigo.ilike.%${q}%`)
        }
        
        const { data: testData, error: testError, count } = await query
          .order('nome', { ascending: true })
          .range(from, to)
          
        if (!testError && testData) {
          if (count) {
            totalCount = count
            totalPages = Math.ceil(count / limit)
          }
      clientes = testData.map(d => ({
        id: d.id,
        codigo: d.codigo || "",
        nome: d.nome,
        cpf_cnpj: d.cpf_cnpj || d.documento || "-", 
        celular: d.celular || d.telefone || "-",
        email: d.email || "-",
        cidade: d.cidade || "-",
        estado: d.estado || "-",
        status: "Ativo"
      }))
      }
      }
    }
  } catch (e) {
    console.warn("Supabase não configurado ou erro ao buscar clientes. Usando mock data.", e)
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-500 mb-1">
            <Users className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo Comercial</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua carteira de clientes, pessoa física ou jurídica.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link 
            href="/clientes/novo"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-violet-600 text-white hover:bg-violet-700 shadow-md shadow-violet-500/20 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Link>
        </div>
      </div>

      <ClientesTable data={clientes} />
      
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  )
}
