import Image from 'next/image'
import Link from 'next/link'
import { 
  Users, UserPlus, Contact,
  Briefcase, Truck, Factory,
  FileSpreadsheet, Calculator,
  ShoppingBag, Receipt,
  Boxes, PackagePlus, ArrowRightLeft,
  LineChart, PieChart,
  SlidersHorizontal, Cog,
  ArrowRight, Sparkles
} from 'lucide-react'

const modules = [
  {
    title: "Vendedores",
    description: "Gestão da equipe de vendas",
    icon: <Briefcase className="h-6 w-6 text-blue-500" />,
    bgLight: "bg-blue-500/10",
    borderGlow: "group-hover:border-blue-500/30",
    links: [
      { label: "Cadastrar Vendedor", href: "/vendedores/novo", icon: <UserPlus className="h-4 w-4" /> },
      { label: "Equipe de Vendas", href: "/vendedores", icon: <Users className="h-4 w-4" /> },
    ]
  },
  {
    title: "Clientes",
    description: "Carteira e relacionamento",
    icon: <Contact className="h-6 w-6 text-emerald-500" />,
    bgLight: "bg-emerald-500/10",
    borderGlow: "group-hover:border-emerald-500/30",
    links: [
      { label: "Novo Cliente", href: "/clientes/novo", icon: <UserPlus className="h-4 w-4" /> },
      { label: "Listar Clientes", href: "/clientes", icon: <Users className="h-4 w-4" /> },
    ]
  },
  {
    title: "Fornecedores",
    description: "Gestão de suprimentos",
    icon: <Truck className="h-6 w-6 text-orange-500" />,
    bgLight: "bg-orange-500/10",
    borderGlow: "group-hover:border-orange-500/30",
    links: [
      { label: "Novo Fornecedor", href: "/fornecedores/novo", icon: <Factory className="h-4 w-4" /> },
      { label: "Listar Fornecedores", href: "/fornecedores", icon: <Users className="h-4 w-4" /> },
    ]
  },
  {
    title: "Orçamentos",
    description: "Propostas comerciais",
    icon: <FileSpreadsheet className="h-6 w-6 text-purple-500" />,
    bgLight: "bg-purple-500/10",
    borderGlow: "group-hover:border-purple-500/30",
    links: [
      { label: "Novo Orçamento", href: "/orcamentos/novo", icon: <Calculator className="h-4 w-4" /> },
      { label: "Histórico de Orçamentos", href: "/orcamentos", icon: <Receipt className="h-4 w-4" /> },
    ]
  },
  {
    title: "Pedidos",
    description: "Faturamento e conversão",
    icon: <ShoppingBag className="h-6 w-6 text-rose-500" />,
    bgLight: "bg-rose-500/10",
    borderGlow: "group-hover:border-rose-500/30",
    links: [
      { label: "Emitir Pedido", href: "/pedidos/novo", icon: <PackagePlus className="h-4 w-4" /> },
      { label: "Central de Pedidos", href: "/pedidos", icon: <Receipt className="h-4 w-4" /> },
    ]
  },
  {
    title: "Estoque",
    description: "Produtos e movimentações",
    icon: <Boxes className="h-6 w-6 text-indigo-500" />,
    bgLight: "bg-indigo-500/10",
    borderGlow: "group-hover:border-indigo-500/30",
    links: [
      { label: "Cadastrar Produto", href: "/estoque/novo", icon: <PackagePlus className="h-4 w-4" /> },
      { label: "Entrada de Saldo", href: "/estoque/entrada", icon: <ArrowRightLeft className="h-4 w-4" /> },
      { label: "Inventário", href: "/estoque", icon: <Boxes className="h-4 w-4" /> },
    ]
  },
  {
    title: "Estatísticas",
    description: "Visão estratégica do negócio",
    icon: <LineChart className="h-6 w-6 text-amber-500" />,
    bgLight: "bg-amber-500/10",
    borderGlow: "group-hover:border-amber-500/30",
    links: [
      { label: "Painel de Dados", href: "/estatisticas", icon: <PieChart className="h-4 w-4" /> },
    ]
  },
  {
    title: "Configurações",
    description: "Ajustes e preferências",
    icon: <SlidersHorizontal className="h-6 w-6 text-slate-500" />,
    bgLight: "bg-slate-500/10",
    borderGlow: "group-hover:border-slate-500/30",
    links: [
      { label: "Ajustes Gerais", href: "/configuracoes", icon: <Cog className="h-4 w-4" /> },
    ]
  }
]

export default async function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 h-[calc(100vh-3.5rem)] md:h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background relative">
      
      {/* Decoração de Fundo */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl opacity-50 pointer-events-none" />

      {/* Hero Section */}
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4">
        <div className="space-y-1 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            JC2B <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">PARTS</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
            Gestão integrada de ponta a ponta. Acompanhe suas vendas, controle seu estoque e expanda seus resultados.
          </p>
        </div>
      </div>

      {/* Grid de Módulos (Design Premium SaaS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10 flex-1 content-start">
        {modules.map((mod, i) => (
          <div 
            key={i} 
            className={`group flex flex-col rounded-xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${mod.borderGlow}`}
          >
            {/* Header do Card */}
            <div className="p-3 flex items-start gap-3">
              <div className={`p-2.5 rounded-xl shadow-inner border border-white/10 dark:border-white/5 ${mod.bgLight} transition-colors duration-300`}>
                {mod.icon}
              </div>
              <div className="pt-1">
                <h2 className="font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">{mod.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mod.description}</p>
              </div>
            </div>
            
            {/* Ações / Links */}
            <div className="px-2 pb-2 pt-0 flex-1 flex flex-col justify-end">
              <ul className="space-y-0.5">
                {mod.links.map((link, j) => (
                  <li key={j}>
                    <Link 
                      href={link.href}
                      className="group/link flex items-center justify-between px-2 py-1.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 shadow-sm border border-transparent hover:border-border/60 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground/60 group-hover/link:text-primary transition-colors duration-200">
                          {link.icon}
                        </span>
                        {link.label}
                      </div>
                      <div className="bg-background/50 p-1 rounded-md opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-200 shadow-sm">
                        <ArrowRight className="h-3.5 w-3.5 text-primary" />
                      </div>
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
