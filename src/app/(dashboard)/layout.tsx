import Image from 'next/image'
import Link from 'next/link'
import { LogoutButton } from './components/logout-button'
import { createClient } from '@/lib/supabase/server'
import { TopNav } from './components/top-nav'

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
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Barra superior */}
      <header className="flex h-14 items-center gap-3 border-b bg-muted/20 px-4 shrink-0">
        <div className="md:hidden">
          <MobileNav />
        </div>
        <Link href="/" className="flex items-center shrink-0 bg-white rounded px-1.5 py-1">
          <Image src="/logo.png" alt="JC2B Parts" width={110} height={32} className="object-contain" />
        </Link>
        <div className="hidden md:flex flex-1 min-w-0">
          <TopNav isAdmin={isAdmin} />
        </div>
        <div className="ml-auto hidden md:block shrink-0">
          <LogoutButton compact />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
