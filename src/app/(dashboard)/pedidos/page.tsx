import Link from 'next/link'
import { Plus, Search, FileText } from 'lucide-react'

export default async function PedidosPage() {
  // Array vazio para representar a lista de pedidos inicial
  const pedidos = []

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Pedidos</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Gestão e histórico de vendas do JC2B.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            href="/pedidos/novo"
            className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 active:translate-y-0 h-10 px-5 py-2"
          >
            <Plus className="mr-2 h-4 w-4" /> Novo Pedido
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-4 bg-muted/20 p-2 rounded-xl border border-border/50 backdrop-blur-md">
        <div className="relative flex-1 max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
           <input 
             type="text" 
             placeholder="Buscar por número do pedido ou cliente..." 
             className="flex h-10 w-full rounded-lg border-0 bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 pl-9"
           />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center py-24 text-center">
        <div className="h-14 w-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <FileText className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Nenhum pedido encontrado</h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-6">
          Você ainda não possui nenhum pedido registrado no sistema. Clique no botão abaixo para criar sua primeira venda.
        </p>
        <Link 
          href="/pedidos/novo"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
        >
          Criar Novo Pedido
        </Link>
      </div>
    </div>
  )
}
