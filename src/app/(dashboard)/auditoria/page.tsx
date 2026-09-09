'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Activity, TrendingDown, Users, Download, RefreshCw } from 'lucide-react'
import { getAuditSummary, detectSecurityThreats, exportAuditLogs } from '@/app/actions/monitoring'

export default function AuditoriaPage() {
  const [summary, setSummary] = useState<any>(null)
  const [threats, setThreats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [summaryRes, threatsRes] = await Promise.all([
      getAuditSummary(),
      detectSecurityThreats(),
    ])
    setSummary(summaryRes)
    setThreats(threatsRes)
    setLoading(false)
  }

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(true)
    const result = await exportAuditLogs(format, 30)
    if (result.error) {
      alert(`Erro ao exportar: ${result.error}`)
    } else {
      // Criar download
      const element = document.createElement('a')
      element.setAttribute(
        'href',
        `data:${result.format || 'text/plain'};charset=utf-8,${encodeURIComponent(result.data || '')}`
      )
      element.setAttribute('download', `audit-logs.${format}`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
    setExporting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados de auditoria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Auditoria & Monitoramento</h1>
          <p className="text-muted-foreground mt-2">Acompanhe atividades e alertas de segurança</p>
        </div>
        <button
          onClick={() => loadData()}
          disabled={loading || false}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Alertas de Segurança */}
      {threats?.alerts && threats.alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">
              {threats.alerts.length} Alerta(s) de Segurança
            </h2>
          </div>
          <div className="space-y-3">
            {threats.alerts.map((alert: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  alert.severity === 'high'
                    ? 'bg-red-100 border border-red-300'
                    : 'bg-yellow-100 border border-yellow-300'
                }`}
              >
                <p className={`font-medium ${alert.severity === 'high' ? 'text-red-900' : 'text-yellow-900'}`}>
                  {alert.message}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {alert.type.replace(/_/g, ' ').toUpperCase()} • {new Date(alert.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background border border-border/50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total de Operações</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {summary?.totalOperations || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-2">últimos 30 dias</p>
            </div>
            <Activity className="h-10 w-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-background border border-border/50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Erros Registrados</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {summary?.errorCount || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-2">últimos 7 dias</p>
            </div>
            <TrendingDown className="h-10 w-10 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-background border border-border/50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              <p className="text-3xl font-bold text-foreground mt-2">
                {summary?.topUsers?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-2">últimos 30 dias</p>
            </div>
            <Users className="h-10 w-10 text-green-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Usuários Mais Ativos */}
      {summary?.topUsers && summary.topUsers.length > 0 && (
        <div className="bg-background border border-border/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Usuários Mais Ativos</h3>
          <div className="space-y-3">
            {summary.topUsers.map((user: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {user.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-foreground">{user.email}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">{user.count} operações</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Últimas Operações */}
      {summary?.recentLogs && summary.recentLogs.length > 0 && (
        <div className="bg-background border border-border/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Últimas Operações</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {summary.recentLogs.map((log: any, idx: number) => (
              <div key={idx} className="py-3 px-3 border-l-2 border-blue-500 bg-blue-50/30">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">
                      {log.action} - {log.resource_type}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {log.user_email} • {log.resource_name || '-'}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded ${
                      log.result === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {log.result}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(log.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exportar Logs */}
      <div className="bg-background border border-border/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Exportar Logs</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Exporte os últimos 30 dias de logs para análise e compliance
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>
    </div>
  )
}
