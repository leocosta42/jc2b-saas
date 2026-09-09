import { getTenantConfig } from "@/app/actions/configuracoes"
import { ConfigForm } from "./config-form"
import { Building2, Shield, BarChart3 } from "lucide-react"
import Link from "next/link"

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

      {/* Segurança & Auditoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-8">
        <Link href="/auditoria">
          <div className="h-full p-6 rounded-lg border border-border/50 hover:border-blue-500/50 hover:bg-blue-50/30 transition-all cursor-pointer group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Auditoria & Monitoramento</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Visualize logs de atividades e alertas de segurança
                  </p>
                </div>
              </div>
              <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </Link>

        <div className="p-6 rounded-lg border border-border/50 bg-gray-50/50">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Segurança Ativa</h3>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>✓ Autenticação com Zod Validation</li>
                <li>✓ Rate Limiting (5 tentativas / 15min)</li>
                <li>✓ Auditoria completa de operações</li>
                <li>✓ Detecção de ameaças automática</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <ConfigForm config={config || undefined} />
    </div>
  )
}
