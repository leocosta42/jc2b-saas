import { FornecedoresTable, Fornecedor } from "./fornecedores-table"
import { createClient } from "@/lib/supabase/server"
import { Truck, Plus } from "lucide-react"
import Link from "next/link"

const mockFornecedores: Fornecedor[] = [
  {
    id: "f1",
    codigo: "FORN001",
    nome: "SBA-MAQUINAS PARA BOBINAGEM E AUTOMACAO",
    cnpj_cpf: "14.073.137/0001-80",
    telefone: "(16) 9999-9999",
    email: "nfe@sba.net.br",
    status: "Ativo"
  },
  {
    id: "f2",
    codigo: "FORN002",
    nome: "TIAGO GUSTINELLI BORTOLETTO ME",
    cnpj_cpf: "28.550.327/0001-56",
    telefone: "(19) 9999-9999",
    email: "tiagogootooetto@gmail.com",
    status: "Ativo"
  },
  {
    id: "f3",
    codigo: "FORN003",
    nome: "PINDAMONHANGABA DISTRIBUIDORA",
    cnpj_cpf: "00.000.000/0000-00",
    telefone: "(12) 9999-9999",
    email: "contato@pindadist.com.br",
    status: "Inativo"
  }
]

export default async function FornecedoresPage() {
  let fornecedores: Fornecedor[] = mockFornecedores

  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    
    if (authData?.user) {
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authData.user.id).single()
      
      if (profile?.tenant_id) {
        const { data: testData, error: testError } = await supabase
          .from('fornecedores')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .eq('ativo', true)
          .limit(50)
          
        if (!testError && testData && testData.length > 0) {
      fornecedores = testData.map(d => ({
        id: d.id,
        codigo: d.codigo || "-",
        nome: d.nome,
        cnpj_cpf: d.cnpj_cpf || d.documento || "-", // Adapt to whatever we mapped in schema
        telefone: d.telefone || "-",
        email: d.email || "-",
        status: "Ativo"
      }))
      }
    }
  } catch (e) {
    console.warn("Supabase não configurado ou erro ao buscar fornecedores. Usando mock data.", e)
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-orange-500 mb-1">
            <Truck className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo de Suprimentos</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Fornecedores</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua base de fornecedores e parceiros logísticos.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link 
            href="/fornecedores/novo"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Fornecedor
          </Link>
        </div>
      </div>

      <FornecedoresTable data={fornecedores} />
    </div>
  )
}
