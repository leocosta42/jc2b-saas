import { createClient } from '@/lib/supabase/server'
import { getAjustesEstoque, getProdutosParaConsulta } from '@/app/actions/estoque'
import { AjusteForm } from './ajuste-form'
import { AjustesHistorico } from './ajustes-historico'
import { Boxes, ShieldAlert, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AjustesEstoquePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const resolvedParams = await searchParams
  const page = resolvedParams?.page ? parseInt(resolvedParams.page, 10) : 1

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

  if (!isAdmin) {
    return (
      <div className="flex-1 p-6 md:p-8 pt-6 min-h-screen">
        <div className="rounded-xl border border-border/50 bg-card/40 p-8 flex flex-col items-center text-center gap-3 max-w-lg mx-auto mt-12">
          <ShieldAlert className="h-10 w-10 text-amber-500" />
          <h2 className="text-lg font-semibold">Acesso restrito</h2>
          <p className="text-muted-foreground text-sm">
            Somente administradores podem ajustar o saldo de estoque. Fale com um administrador da sua empresa se precisar corrigir um saldo.
          </p>
          <Link href="/estoque" className="text-primary text-sm font-medium hover:underline mt-2">
            Voltar para Estoque
          </Link>
        </div>
      </div>
    )
  }

  const [{ data: ajustes, totalPages }, produtosIniciais] = await Promise.all([
    getAjustesEstoque({ page }),
    getProdutosParaConsulta(),
  ])

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div>
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Link href="/estoque" className="hover:text-foreground transition-colors flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </div>
        <div className="flex items-center gap-2 text-indigo-500 mb-1">
          <Boxes className="h-5 w-5" />
          <span className="font-semibold tracking-wider uppercase text-sm">Módulo de Estoque</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Ajustes de Estoque</h1>
        <p className="text-muted-foreground mt-1">
          Corrija o saldo de um produto manualmente (entrada, devolução, perda ou contagem física) com histórico completo.
        </p>
      </div>

      <AjusteForm produtosIniciais={produtosIniciais} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Histórico de Ajustes</h2>
        <AjustesHistorico data={ajustes} currentPage={page} totalPages={totalPages} />
      </div>
    </div>
  )
}
