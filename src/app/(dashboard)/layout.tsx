import Link from 'next/link'
import { LayoutDashboard, Settings, FileText, LogOut, Users, Package } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 hidden md:block">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b px-4">
            <span className="font-bold text-lg">JC2B</span>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <Link href="/" className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary transition-all">
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
              <FileText className="h-5 w-5" />
              Estatísticas
            </Link>
            <Link href="/configuracoes" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
              <Settings className="h-5 w-5" />
              Configurações
            </Link>
          </nav>
          <div className="border-t p-4">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted transition-all">
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
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
