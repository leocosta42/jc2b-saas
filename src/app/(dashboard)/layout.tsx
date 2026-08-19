import Link from 'next/link'
import { LayoutDashboard, FileSpreadsheet, Briefcase, Contact, Truck, Boxes, LineChart, SlidersHorizontal } from 'lucide-react'
import { LogoutButton } from './components/logout-button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 hidden md:flex flex-col">
        <div className="flex h-14 items-center border-b px-4 shrink-0">
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">JC2B PARTS</span>
        </div>
        <nav className="flex-1 space-y-1.5 p-4 overflow-y-auto">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/orcamentos" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-purple-500/10 hover:text-purple-500 transition-all">
            <FileSpreadsheet className="h-5 w-5" />
            Vendas / Orçamentos
          </Link>
          <Link href="/vendedores" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-all">
            <Briefcase className="h-5 w-5" />
            Vendedores
          </Link>
          <Link href="/clientes" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500 transition-all">
            <Contact className="h-5 w-5" />
            Clientes
          </Link>
          <Link href="/fornecedores" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-orange-500/10 hover:text-orange-500 transition-all">
            <Truck className="h-5 w-5" />
            Fornecedores
          </Link>
          <Link href="/estoque" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-indigo-500/10 hover:text-indigo-500 transition-all">
            <Boxes className="h-5 w-5" />
            Estoque
          </Link>
          <Link href="/estatisticas" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500 transition-all">
            <LineChart className="h-5 w-5" />
            Estatísticas
          </Link>
          <Link href="/configuracoes" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-slate-500/10 hover:text-slate-500 transition-all">
            <SlidersHorizontal className="h-5 w-5" />
            Configurações
          </Link>
        </nav>
        <div className="border-t p-4 shrink-0">
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/20 px-4 md:hidden">
          <span className="font-bold">JC2B</span>
        </header>
        {children}
      </main>
    </div>
  )
}
