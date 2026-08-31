import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, FileSpreadsheet, Briefcase, Contact, Truck, Boxes, LineChart, SlidersHorizontal, Shield } from 'lucide-react'
import { LogoutButton } from './components/logout-button'
import { createClient } from '@/lib/supabase/server'

import { MobileNav } from './components/mobile-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  let isAdmin = false
  if (authData?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()
    const role = profile?.role?.toLowerCase() || ''
    isAdmin = ['admin', 'gerente', 'dono'].includes(role)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20 hidden md:flex flex-col">
        <div className="flex h-14 items-center justify-center border-b px-4 shrink-0 bg-white">
          <Image src="/logo.png" alt="JC2B Parts" width={140} height={40} className="object-contain" />
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
          {isAdmin && (
            <Link href="/equipe" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-teal-500/10 hover:text-teal-500 transition-all">
              <Shield className="h-5 w-5" />
              Equipe / Acessos
            </Link>
          )}
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
          <MobileNav />
          <span className="font-bold">JC2B</span>
          <div className="ml-auto">
            {/* Opcional: botão extra no header mobile se precisar */}
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
