'use client'

import { Pagination } from '@/app/components/Pagination'
import { ArrowUp, ArrowDown } from 'lucide-react'

const MOTIVO_LABELS: Record<string, string> = {
  entrada_manual: 'Entrada Manual',
  devolucao: 'Devolução',
  perda: 'Perda / Dano',
  contagem: 'Contagem Física',
}

interface AjusteRow {
  id: string
  quantidade_anterior: number
  quantidade_nova: number
  motivo: string
  observacoes: string | null
  created_at: string
  produtos: { nome: string; sku: string | null } | null
  profiles: { full_name: string | null } | null
}

export function AjustesHistorico({ data, currentPage, totalPages }: { data: AjusteRow[]; currentPage: number; totalPages: number }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 border-b text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium text-center">Anterior</th>
              <th className="px-4 py-3 font-medium text-center">Novo</th>
              <th className="px-4 py-3 font-medium text-center">Diferença</th>
              <th className="px-4 py-3 font-medium">Motivo</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Observações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((a) => {
              const diff = a.quantidade_nova - a.quantidade_anterior
              return (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {new Date(a.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.produtos?.nome || '-'}</div>
                    <div className="text-xs text-muted-foreground">{a.produtos?.sku || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{a.quantidade_anterior}</td>
                  <td className="px-4 py-3 text-center font-medium">{a.quantidade_nova}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 font-medium ${diff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {diff >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(diff)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-600">
                      {MOTIVO_LABELS[a.motivo] || a.motivo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.profiles?.full_name || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate" title={a.observacoes || ''}>
                    {a.observacoes || '-'}
                  </td>
                </tr>
              )
            })}
            {data.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum ajuste de estoque registrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} />}
    </div>
  )
}
