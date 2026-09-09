import { getTenantConfig } from "@/app/actions/configuracoes"
import { ConfigForm } from "./config-form"
import { Building2, Shield, BarChart3 } from "lucide-react"
import Link from "next/link"

export default async function ConfiguracoesPage() {
  const config = await getTenantConfig()

  return (
    <div className="flex-1 p-6 md:p-8 pt-6 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-violet-500 mb-1">
            <Building2 className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Administração</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        </div>

        {/* Grid com 2 colunas - Esquerda: Auditoria, Direita: Empresa */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Segurança (1 coluna) */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Segurança</h2>

            {/* Link para Auditoria */}
            <Link href="/auditoria" className="block">
              <div className="p-4 rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-sm">Auditoria</h3>
                    <p className="text-xs text-muted-foreground">Logs e alertas</p>
                  </div>
                  <span className="text-lg group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </div>
            </Link>

            {/* Card de Segurança */}
            <div className="p-4 rounded-lg border border-green-200 bg-green-50/50">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground text-sm">Proteção Ativa</h3>
                  <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                    <li>✓ Validação Zod</li>
                    <li>✓ Rate Limiting</li>
                    <li>✓ Auditoria</li>
                    <li>✓ Alertas</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Configurações Empresa (2 colunas) */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-foreground mb-4">Dados da Empresa</h2>
            <ConfigForm config={config || undefined} />
          </div>
        </div>
      </div>
    </div>
  )
}
