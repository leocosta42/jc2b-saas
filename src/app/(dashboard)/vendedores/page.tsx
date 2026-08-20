import { VendedoresTable, Vendedor } from "./vendedores-table"
import { createClient } from "@/lib/supabase/server"
import { UserCircle, Plus } from "lucide-react"
import Link from "next/link"

const mockVendedores: Vendedor[] = [
  {
    id: "v1",
    codigo: "VEN001",
    nome: "Vendedor Padrão 1",
    cpf_cnpj: "111.111.111-11",
    telefone: "(11) 99999-9999",
    email: "vendedor1@empresa.com",
    comissao_percentual: 5.0,
    status: "Ativo"
  },
  {
    id: "v2",
    codigo: "VEN002",
    nome: "Vendedor Padrão 2",
    cpf_cnpj: "222.222.222-22",
    telefone: "(11) 98888-8888",
    email: "vendedor2@empresa.com",
    comissao_percentual: 7.5,
    status: "Ativo"
  }
]

export default async function VendedoresPage() {
  let vendedores: Vendedor[] = mockVendedores

  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    
    if (authData?.user) {
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authData.user.id).single()
      
      if (profile?.tenant_id) {
        const { data: testData, error: testError } = await supabase
          .from('vendedores')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .eq('ativo', true)
          .limit(50)
          
        if (!testError && testData && testData.length > 0) {
      vendedores = testData.map(d => ({
        id: d.id,
        codigo: d.codigo || "-",
        nome: d.nome,
        cpf_cnpj: d.cpf_cnpj || "-",
        telefone: d.telefone,
        email: d.email,
        comissao_percentual: d.comissao_percentual,
        status: "Ativo"
      }))
      }
    }
  } catch (e) {
    console.warn("Supabase não configurado ou erro ao buscar vendedores. Usando mock data.", e)
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <UserCircle className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo Administrativo</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vendedores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários e vendedores responsáveis pelos orçamentos.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link 
            href="/vendedores/novo"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Vendedor
          </Link>
        </div>
      </div>

      <VendedoresTable data={vendedores} />
    </div>
  )
}
