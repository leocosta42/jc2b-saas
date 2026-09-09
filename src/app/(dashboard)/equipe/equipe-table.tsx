'use client'

import { useState, useTransition } from 'react'
import { updateRole, deactivateUser, deleteUser } from '@/app/actions/equipe'
import { useRouter } from 'next/navigation'
import { User, ShieldAlert, Check, Loader2, Lock, Trash2 } from 'lucide-react'

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

  const handleDeactivate = (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja desativar ${userName}?`)) return

    setLoadingId(userId)
    startTransition(async () => {
      const res = await deactivateUser(userId)
      setLoadingId(null)
      if (res.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleDelete = (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja DELETAR ${userName}? Esta ação não pode ser desfeita.`)) return

    setLoadingId(userId)
    startTransition(async () => {
      const res = await deleteUser(userId)
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
              <th className="px-6 py-4 font-semibold text-center">Ações</th>
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
                  {user.ativo !== false ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      Ativo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                      Desativado
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {user.ativo !== false && (
                      <button
                        onClick={() => handleDeactivate(user.id, user.full_name || 'Usuário')}
                        disabled={isPending && loadingId === user.id}
                        title="Desativar usuário"
                        className="p-2 rounded-md hover:bg-yellow-500/10 hover:text-yellow-600 text-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending && loadingId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(user.id, user.full_name || 'Usuário')}
                      disabled={isPending && loadingId === user.id}
                      title="Deletar usuário"
                      className="p-2 rounded-md hover:bg-red-500/10 hover:text-red-600 text-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending && loadingId === user.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
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
