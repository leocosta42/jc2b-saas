import { createClient } from '@/lib/supabase/server'
import { EstatisticasTable, Estatistica } from './estatisticas-table'
import { BarChart3, Users, Package, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function EstatisticasPage() {
  const supabase = await createClient()
  
  // 1. Obter informações de KPIs
  const { count: clientesCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
  const { count: fornecedoresCount } = await supabase.from('fornecedores').select('*', { count: 'exact', head: true })
  const { count: produtosCount } = await supabase.from('produtos').select('*', { count: 'exact', head: true })
  
  // 2. Faturamento e Lucro
  // O ideal seria usar uma RPC function do PostgreSQL para sum(), mas vamos agregar no server side para simplificar o MVP
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(`
      status, 
      created_at,
      valor_frete,
      itens_pedido (quantidade, preco_unitario, desconto_percentual)
    `)
    
  let faturamentoTotal = 0;
  let pedidosAprovados = 0;
  
  if (pedidos) {
    pedidos.forEach(p => {
      // Ignorar orçamentos não faturados se houver distinção de status
      if (p.status !== 'Cancelado') {
        const subtotal = (p.itens_pedido || []).reduce((acc: number, item: any) => {
          return acc + ((Number(item.quantidade) * Number(item.preco_unitario)) * (1 - (Number(item.desconto_percentual)/100)))
        }, 0)
        faturamentoTotal += subtotal + (Number(p.valor_frete) || 0);
        pedidosAprovados++;
      }
    })
  }

  // 3. Gerar a Base de Estatísticas Detalhada (100 ultimos itens vendidos)
  const { data: itensVendidos } = await supabase
    .from('itens_pedido')
    .select(`
      id,
      quantidade,
      preco_unitario,
      unidade_medida,
      subtotal,
      pedidos!inner (
        numero_pedido,
        data_emissao,
        status,
        clientes ( codigo, nome ),
        vendedores ( nome )
      ),
      produtos!inner (
        sku,
        nome,
        preco_custo
      )
    `)
    .neq('pedidos.status', 'Cancelado')
    .order('created_at', { ascending: false })
    .limit(100)

  const realEstatisticas: Estatistica[] = (itensVendidos || []).map((item, index) => {
    const pedido: any = Array.isArray(item.pedidos) ? item.pedidos[0] : item.pedidos;
    const produto: any = Array.isArray(item.produtos) ? item.produtos[0] : item.produtos;
    const cliente: any = pedido?.clientes ? (Array.isArray(pedido.clientes) ? pedido.clientes[0] : pedido.clientes) : null;
    const vendedor: any = pedido?.vendedores ? (Array.isArray(pedido.vendedores) ? pedido.vendedores[0] : pedido.vendedores) : null;

    const dataObj = pedido?.data_emissao ? new Date(pedido.data_emissao) : new Date();
    const mes = dataObj.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const valorTotal = Number(item.subtotal) || (Number(item.quantidade) * Number(item.preco_unitario));
    const custoUnitario = Number(produto?.preco_custo) || 0;
    const lucro = valorTotal - (custoUnitario * Number(item.quantidade));

    return {
      id: item.id,
      cod_cliente: cliente?.codigo || '-',
      mes: mes,
      nome: cliente?.nome || 'Não Informado',
      pedido: pedido?.numero_pedido?.toString() || '-',
      data_emissao: dataObj.toLocaleDateString('pt-BR'),
      item: (index + 1).toString(),
      codigo_produto: produto?.sku || '-',
      descricao: produto?.nome || '-',
      qtde: item.quantidade,
      um: item.unidade_medida || 'UN',
      valor_unit: item.preco_unitario,
      valor_total: valorTotal,
      valor_custo: custoUnitario,
      lucro_venda: lucro,
      identificador: vendedor?.nome || '-'
    }
  });

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <BarChart3 className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Visão de Negócios</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Base de Estatísticas</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o desempenho das suas vendas e indicadores em tempo real.
          </p>
        </div>
      </div>

      {/* KPI Cards Reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm p-6 hover:border-primary/30 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Faturamento Bruto</p>
              <p className="text-3xl font-black mt-2 text-foreground">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoTotal)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-500 font-medium">
            <TrendingUp className="h-3 w-3 mr-1" />
            <span>Atualizado em tempo real</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm p-6 hover:border-blue-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pedidos / Vendas</p>
              <p className="text-3xl font-black mt-2 text-foreground">{pedidosAprovados}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Pedidos emitidos ativos</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm p-6 hover:border-emerald-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clientes Cadastrados</p>
              <p className="text-3xl font-black mt-2 text-foreground">{clientesCount || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Na base de dados</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm p-6 hover:border-indigo-500/30 transition-colors">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produtos Ativos</p>
              <p className="text-3xl font-black mt-2 text-foreground">{produtosCount || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">Itens disponíveis</p>
        </div>
      </div>

      <div className="mt-8">
        <EstatisticasTable data={realEstatisticas} />
      </div>
    </div>
  )
}
