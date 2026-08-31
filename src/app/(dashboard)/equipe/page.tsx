import { getEquipe } from '@/app/actions/equipe'
import { EquipeTable } from './equipe-table'
import { Shield } from 'lucide-react'

export default async function EquipePage() {
  const { data: equipe, error } = await getEquipe()

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-indigo-500" />
            Gerenciar Equipe
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários e os níveis de acesso ao sistema da sua empresa.
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          {error}
        </div>
      ) : (
        <EquipeTable data={equipe || []} />
      )}
    </div>
  )
}
