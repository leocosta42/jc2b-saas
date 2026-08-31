'use client'

import { useState, useTransition } from 'react'
import { updateRole } from '@/app/actions/equipe'
import { useRouter } from 'next/navigation'
import { User, ShieldAlert, Check, Loader2 } from 'lucide-react'

export function EquipeTable({ data }: { data: any[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleRoleChange = (userId: string, newRole: string) => {
    setLoadingId(userId)
    startTransition(async () => {
      const res = await updateRole(userId, newRole)
      setLoadingId(null)
      if (res.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/30 border-b text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-semibold">Usuário</th>
              <th className="px-6 py-4 font-semibold">Cargo / Nível de Acesso</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.map((user) => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                      {(user.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.full_name || 'Usuário Sem Nome'}</p>
                      <p className="text-xs text-muted-foreground">ID: {user.id.substring(0, 8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role || 'vendedor'}
                      disabled={isPending && loadingId === user.id}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    >
                      <option value="admin">Administrador (Acesso Total)</option>
                      <option value="gerente">Gerente</option>
                      <option value="vendedor">Vendedor (Acesso Restrito)</option>
                    </select>
                    {isPending && loadingId === user.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Ativo
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado na sua empresa.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
