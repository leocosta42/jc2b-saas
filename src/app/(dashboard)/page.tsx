import Link from 'next/link'
import { Users, UserCircle, Truck, FileText, ShoppingCart, Package, Settings, BarChart3, Plus, List, ArrowRight } from 'lucide-react'

// Estrutura de dados espelhando os botões do VBA da imagem
const modules = [
  {
    title: "Vendedores",
    icon: <UserCircle className="h-6 w-6 text-blue-500" />,
    color: "bg-blue-500/5 border-blue-500/20",
    links: [
      { label: "Cadastrar vendedor", href: "/vendedores/novo", icon: <Plus className="h-4 w-4" /> },
      { label: "Vendedores", href: "/vendedores", icon: <List className="h-4 w-4" /> },
    ]
  },
  {
    title: "Clientes",
    icon: <Users className="h-6 w-6 text-emerald-500" />,
    color: "bg-emerald-500/5 border-emerald-500/20",
    links: [
      { label: "Cadastrar cliente", href: "/clientes/novo", icon: <Plus className="h-4 w-4" /> },
      { label: "Clientes", href: "/clientes", icon: <List className="h-4 w-4" /> },
    ]
  },
  {
    title: "Fornecedores",
    icon: <Truck className="h-6 w-6 text-orange-500" />,
    color: "bg-orange-500/5 border-orange-500/20",
    links: [
      { label: "Cadastrar fornecedor", href: "/fornecedores/novo", icon: <Plus className="h-4 w-4" /> },
      { label: "Fornecedores", href: "/fornecedores", icon: <List className="h-4 w-4" /> },
    ]
  },
  {
    title: "Orçamentos",
    icon: <FileText className="h-6 w-6 text-purple-500" />,
    color: "bg-purple-500/5 border-purple-500/20",
    links: [
      { label: "Emitir orçamento", href: "/orcamentos/novo", icon: <Plus className="h-4 w-4" /> },
      { label: "Resumo de orçamentos", href: "/orcamentos", icon: <List className="h-4 w-4" /> },
    ]
  },
  {
    title: "Pedidos",
    icon: <ShoppingCart className="h-6 w-6 text-rose-500" />,
    color: "bg-rose-500/5 border-rose-500/20",
    links: [
      { label: "Emitir pedido", href: "/pedidos/novo", icon: <Plus className="h-4 w-4" /> },
      { label: "Resumo de pedidos", href: "/pedidos", icon: <List className="h-4 w-4" /> },
    ]
  },
  {
    title: "Produtos",
    icon: <Package className="h-6 w-6 text-indigo-500" />,
    color: "bg-indigo-500/5 border-indigo-500/20",
    links: [
      { label: "Cadastrar produto", href: "/estoque/novo", icon: <Plus className="h-4 w-4" /> },
      { label: "Incluir Saldo (Entrada)", href: "/estoque/entrada", icon: <Plus className="h-4 w-4" /> },
      { label: "Produtos / Estoque", href: "/estoque", icon: <List className="h-4 w-4" /> },
    ]
  },
  {
    title: "Estatísticas",
    icon: <BarChart3 className="h-6 w-6 text-amber-500" />,
    color: "bg-amber-500/5 border-amber-500/20",
    links: [
      { label: "Dados estatísticos", href: "/estatisticas", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "Dashboard", href: "/dashboard", icon: <List className="h-4 w-4" /> },
    ]
  },
  {
    title: "Configurações",
    icon: <Settings className="h-6 w-6 text-slate-500" />,
    color: "bg-slate-500/5 border-slate-500/20",
    links: [
      { label: "Ajustes do Sistema", href: "/configuracoes", icon: <Settings className="h-4 w-4" /> },
    ]
  }
]

export default async function DashboardPage() {
  return (
    <div className="flex-1 space-y-8 p-6 md:p-10 min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/30 via-background to-background">
      
      {/* Header com Logo JC2B PARTS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-gradient-to-br from-primary via-primary to-primary/50 bg-clip-text text-transparent">
            JC2B PARTS
          </h1>
          <p className="text-muted-foreground mt-2 font-medium tracking-wide text-sm uppercase">
            Sistema de Controle de Vendas Full V2 Plus (SaaS)
          </p>
        </div>
      </div>

      {/* Grid de Módulos (Replicando e modernizando a interface antiga) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((mod, i) => (
          <div 
            key={i} 
            className="flex flex-col rounded-2xl border border-border/50 bg-card/60 backdrop-blur-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
          >
            {/* Header do Card */}
            <div className={`p-5 border-b border-border/50 flex items-center gap-3 ${mod.color} transition-colors group-hover:bg-opacity-20`}>
              <div className="p-2 bg-background/80 backdrop-blur-sm rounded-xl shadow-sm border border-border/50">
                {mod.icon}
              </div>
              <h2 className="font-bold text-lg tracking-tight">{mod.title}</h2>
            </div>
            
            {/* Lista de Botões/Links (Substituindo os botões brancos do VBA) */}
            <div className="p-3 flex-1 bg-background/40">
              <ul className="space-y-1.5">
                {mod.links.map((link, j) => (
                  <li key={j}>
                    <Link 
                      href={link.href}
                      className="group/link flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:shadow-sm border border-transparent hover:border-border/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground/70 group-hover/link:text-primary transition-colors">
                          {link.icon}
                        </span>
                        {link.label}
                      </div>
                      <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all text-primary" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
          </div>
        ))}
      </div>
      
    </div>
  )
}
