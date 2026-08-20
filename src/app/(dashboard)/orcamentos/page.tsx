import { OrcamentosTable, Pedido } from "./orcamentos-table"
import { FileText, Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function OrcamentosPage() {
  let pedidos: Pedido[] = []

  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    
    if (authData?.user) {
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authData.user.id).single()
      
      if (profile?.tenant_id) {
        // Busca todos os pedidos/orçamentos
        const { data, error } = await supabase
          .from('pedidos')
          .select(`
            id,
            numero_pedido,
            tipo,
            data_emissao,
            data_entrega,
            status,
            valor_frete,
            clientes (nome, celular),
            itens_pedido (quantidade, preco_unitario, desconto_percentual)
          `)
          .eq('tenant_id', profile.tenant_id)
          .order('numero_pedido', { ascending: false })
          
        if (!error && data) {
          pedidos = data.map((d: any) => {
            // Calcula o valor total com base nos itens
            const subtotalItens = (d.itens_pedido || []).reduce((acc: number, item: any) => {
              const sub = (Number(item.quantidade) * Number(item.preco_unitario)) * (1 - (Number(item.desconto_percentual)/100))
              return acc + sub
            }, 0)
            const valorTotal = subtotalItens + (Number(d.valor_frete) || 0)

            return {
              id: d.id,
              numero: d.numero_pedido || 0,
              tipo: d.tipo || 'PEDIDO',
              cod_cliente: "",
              cliente: d.clientes?.nome || "Sem Cliente",
              data_emissao: d.data_emissao ? new Date(d.data_emissao).toLocaleDateString('pt-BR') : "-",
              data_entrega: d.data_entrega ? new Date(d.data_entrega).toLocaleDateString('pt-BR') : "-",
              valor_total: valorTotal,
              cod_vendedor: "",
              vendedor: "",
              comissao: "0%",
              comissao_venda: 0,
              mes: "",
              celular: d.clientes?.celular || ""
            }
          })
        }
      }
    }
  } catch (e) {
    console.error("Erro ao buscar dados:", e)
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-1">
            <FileText className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo Comercial</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Orçamentos & Pedidos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus orçamentos e converta-os em pedidos.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link 
            href="/orcamentos/novo"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-blue-500 text-white hover:bg-blue-600 shadow-md shadow-blue-500/20 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Link>
          <Link 
            href="/pedidos/novo"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido Direto
          </Link>
        </div>
      </div>

      <OrcamentosTable data={pedidos} />
    </div>
  )
}
