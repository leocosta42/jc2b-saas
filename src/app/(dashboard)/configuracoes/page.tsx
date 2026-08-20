import { getTenantConfig } from "@/app/actions/configuracoes"
import { ConfigForm } from "./config-form"
import { Building2 } from "lucide-react"

export default async function ConfiguracoesPage() {
  const config = await getTenantConfig()

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-violet-500 mb-1">
          <Building2 className="h-5 w-5" />
          <span className="font-semibold tracking-wider uppercase text-sm">Administração</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações da Empresa</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os dados da sua empresa que serão exibidos nos PDFs de orçamentos e pedidos.
        </p>
      </div>

      <ConfigForm config={config || undefined} />
    </div>
  )
}
