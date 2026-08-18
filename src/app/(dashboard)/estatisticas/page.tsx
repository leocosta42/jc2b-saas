import { createClient } from '@/lib/supabase/server'
import { EstatisticasTable, Estatistica } from './estatisticas-table'
import { BarChart3 } from 'lucide-react'

const mockEstatisticas: Estatistica[] = [
  {
    id: "1",
    cod_cliente: "C-102",
    mes: "agosto",
    nome: "TIAGO GUSTINELLI BORTOLETTO ME",
    pedido: "2119",
    data_emissao: "18/08/2026",
    item: "1",
    codigo_produto: "PRD-001",
    descricao: "Mochila Executiva Premium",
    qtde: 5,
    um: "UN",
    valor_unit: 250.00,
    valor_total: 1250.00,
    valor_custo: 500.00,
    lucro_venda: 750.00,
    identificador: "ID-9092"
  },
  {
    id: "2",
    cod_cliente: "C-102",
    mes: "agosto",
    nome: "TIAGO GUSTINELLI BORTOLETTO ME",
    pedido: "2119",
    data_emissao: "18/08/2026",
    item: "2",
    codigo_produto: "PRD-045",
    descricao: "Caneca de Cerâmica Branca",
    qtde: 20,
    um: "UN",
    valor_unit: 35.00,
    valor_total: 700.00,
    valor_custo: 200.00,
    lucro_venda: 500.00,
    identificador: "ID-9093"
  },
  {
    id: "3",
    cod_cliente: "C-088",
    mes: "julho",
    nome: "SBA-MAQUINAS PARA BOBINAGEM",
    pedido: "2105",
    data_emissao: "25/07/2026",
    item: "1",
    codigo_produto: "PRD-010",
    descricao: "Uniforme Esportivo - Kit",
    qtde: 50,
    um: "CX",
    valor_unit: 145.00,
    valor_total: 7250.00,
    valor_custo: 3500.00,
    lucro_venda: 3750.00,
    identificador: "ID-8841"
  }
]

export default async function EstatisticasPage() {
  let estatisticas: Estatistica[] = mockEstatisticas
  
  try {
    const supabase = await createClient()
    
    // Future real integration logic: This would ideally be a view or a complex join across pedidos, itens_pedido, produtos, and clientes
    // We keep mock logic for now to ensure front-end validation
  } catch (error) {
    console.warn("⚠️ Usando mock data para estatísticas.")
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-600 mb-1">
            <BarChart3 className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo de Relatórios</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Base Estatísticas</h1>
          <p className="text-muted-foreground mt-1">
            Visão analítica detalhada de vendas, custos e lucratividade por item.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-6">
          <p className="text-sm font-medium text-muted-foreground">Faturamento Total (Listado)</p>
          <p className="text-2xl font-bold mt-2 text-foreground">R$ 9.200,00</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-6">
          <p className="text-sm font-medium text-muted-foreground">Custo Total (Listado)</p>
          <p className="text-2xl font-bold mt-2 text-foreground">R$ 4.200,00</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm p-6">
          <p className="text-sm font-medium text-muted-foreground">Lucro Total (Listado)</p>
          <p className="text-2xl font-bold mt-2 text-emerald-500">R$ 5.000,00</p>
        </div>
      </div>

      <EstatisticasTable data={estatisticas} />
    </div>
  )
}
