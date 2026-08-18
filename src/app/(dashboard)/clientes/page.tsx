import { createClient } from '@/lib/supabase/server'
import { ClientesTable, Cliente } from './clientes-table'
import { Plus, Search } from 'lucide-react'

export default async function ClientesPage() {
  let clientes: Cliente[] = []
  
  try {
    const supabase = createClient()
    
    // Fetch clientes from database
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (data) {
      clientes = data
    }
  } catch (error) {
    console.warn("⚠️ Supabase não configurado ou erro na conexão. Exibindo dados de teste.")
    clientes = [
      { id: "1", nome: "Tech Solutions Brasil", documento: "12.345.678/0001-90", email: "contato@techsolutions.com.br", telefone: "(11) 99999-9999" },
      { id: "2", nome: "Roberto Almeida", documento: "123.456.789-00", email: "roberto.almeida@gmail.com", telefone: "(11) 98888-8888" },
      { id: "3", nome: "Comercial Martins", documento: "98.765.432/0001-11", email: "vendas@cmartins.com", telefone: "(21) 97777-7777" },
      { id: "4", nome: "Carla Ferreira", documento: "012.345.678-99", email: "carla.f@outlook.com", telefone: "(31) 96666-6666" },
    ]
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Clientes</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie e visualize toda a sua base de clientes do JC2B.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 h-10 px-5 py-2">
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </button>
        </div>
      </div>
      
      {/* Toolbar / Search */}
      <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-xl border border-border/50 backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <input 
             type="text" 
             placeholder="Buscar por nome, email ou documento..." 
             className="flex h-10 w-full rounded-lg border-0 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 pl-9"
           />
        </div>
      </div>

      {/* Data Table */}
      <ClientesTable data={clientes || []} />
    </div>
  )
}
