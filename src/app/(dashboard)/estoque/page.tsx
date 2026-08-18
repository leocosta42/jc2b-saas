import { createClient } from '@/lib/supabase/server'
import { EstoqueTable, Produto } from './estoque-table'
import { Plus, Search, Filter } from 'lucide-react'

export default async function EstoquePage() {
  let produtos: Produto[] = []
  
  try {
    const supabase = createClient()
    
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .order('nome', { ascending: true })
      
    if (data) {
      produtos = data
    }
  } catch (error) {
    console.warn("⚠️ Supabase não configurado ou erro na conexão. Exibindo dados de teste.")
    produtos = [
      { id: "1", sku: "PRD-001", nome: "Uniforme Esportivo Completo", preco_venda: 145.00, quantidade_estoque: 150, estoque_minimo: 50 },
      { id: "2", sku: "PRD-002", nome: "Mochila Executiva Premium", preco_venda: 289.90, quantidade_estoque: 4, estoque_minimo: 10 },
      { id: "3", sku: "PRD-003", nome: "Caneca de Cerâmica Branca", preco_venda: 25.00, quantidade_estoque: 80, estoque_minimo: 100 },
      { id: "4", sku: "PRD-004", nome: "Boné Aba Reta Ajustável", preco_venda: 59.90, quantidade_estoque: 0, estoque_minimo: 30 },
    ]
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Estoque</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Controle de produtos, preços e alertas de reabastecimento do JC2B.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 h-10 px-5 py-2">
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
          </button>
        </div>
      </div>
      
      {/* Toolbar / Search */}
      <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-xl border border-border/50 backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <input 
             type="text" 
             placeholder="Buscar por SKU ou nome do produto..." 
             className="flex h-10 w-full rounded-lg border-0 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 pl-9"
           />
        </div>
        <button className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-muted h-10 px-4 py-2 border border-border/50">
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </button>
      </div>

      {/* Data Table */}
      <EstoqueTable data={produtos || []} />
    </div>
  )
}
