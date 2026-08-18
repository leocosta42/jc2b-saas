import { OrcamentosTable, Pedido } from "./orcamentos-table"
import { FileText, Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

const mockPedidos: Pedido[] = [
  {
    id: "p1",
    numero: 2119,
    tipo: "Venda",
    cod_cliente: "C001",
    cliente: "TIAGO GUSTINELLI BORTOLETTO ME",
    data_emissao: "18/08/2026",
    data_entrega: "28/08/2026",
    valor_total: 4500.00,
    cod_vendedor: "V001",
    vendedor: "Carlos Silva",
    comissao: "5%",
    comissao_venda: 225.00,
    mes: "Agosto"
  },
  {
    id: "p2",
    numero: 2120,
    tipo: "Orçamento",
    cod_cliente: "C002",
    cliente: "SBA-MAQUINAS PARA BOBINAGEM",
    data_emissao: "18/08/2026",
    data_entrega: "25/08/2026",
    valor_total: 12450.50,
    cod_vendedor: "V002",
    vendedor: "Ana Souza",
    comissao: "5%",
    comissao_venda: 622.52,
    mes: "Agosto"
  }
]

export default async function OrcamentosPage() {
  let pedidos: Pedido[] = mockPedidos

  try {
    const supabase = await createClient()
    
    // Tentativa de buscar da base, mas fallback para mock data caso as tabelas não estejam idênticas ainda
    const { data: testData, error: testError } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, valor_total, status, clientes(nome), created_at')
      .order('numero_pedido', { ascending: false })
      .limit(50)
      
    if (!testError && testData && testData.length > 0) {
      // Mapeamento parcial, na base real seria necessário JOIN com vendedores e comissões
      pedidos = testData.map((d: any) => ({
        id: d.id,
        numero: d.numero_pedido || 0,
        tipo: d.status === 'Aprovado' ? 'Venda' : 'Orçamento',
        cod_cliente: "C-000",
        cliente: d.clientes ? d.clientes.nome : "Cliente não informado",
        data_emissao: new Date(d.created_at).toLocaleDateString('pt-BR'),
        data_entrega: new Date(d.created_at).toLocaleDateString('pt-BR'),
        valor_total: d.valor_total || 0,
        cod_vendedor: "V-000",
        vendedor: "Não Atribuído",
        comissao: "0%",
        comissao_venda: 0,
        mes: new Date(d.created_at).toLocaleString('pt-BR', { month: 'long' })
      }))
    }
  } catch (e) {
    console.warn("Usando mock data para pedidos/orçamentos.", e)
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <FileText className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo Comercial</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pedidos & Orçamentos</h1>
          <p className="text-muted-foreground mt-1">
            Resumo de pedidos e propostas comerciais.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link 
            href="/orcamentos/novo"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/20 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Link>
        </div>
      </div>

      <OrcamentosTable data={pedidos} />
    </div>
  )
}
