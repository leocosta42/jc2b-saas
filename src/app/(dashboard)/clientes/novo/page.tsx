import { ClienteForm } from './cliente-form'

export default function NovoClientePage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Novo Cliente</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Adicione um novo cliente à base do JC2B.
        </p>
      </div>
      <ClienteForm />
    </div>
  )
}
