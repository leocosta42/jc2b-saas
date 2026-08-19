import Link from 'next/link'
import { LayoutDashboard, Settings, FileText, Users, Package, BarChart2 } from 'lucide-react'
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
          <span className="font-bold text-lg">JC2B</span>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/orcamentos" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <FileText className="h-5 w-5" />
            Vendas (Orçamentos)
          </Link>
          <Link href="/clientes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Users className="h-5 w-5" />
            Clientes
          </Link>
          <Link href="/estoque" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Package className="h-5 w-5" />
            Estoque
          </Link>
          <Link href="/estatisticas" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <BarChart2 className="h-5 w-5" />
            Estatísticas
          </Link>
          <Link href="/configuracoes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
            <Settings className="h-5 w-5" />
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
