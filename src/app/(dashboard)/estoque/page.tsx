import { createClient } from '@/lib/supabase/server'
import { EstoqueTable, Produto } from './estoque-table'
import { Plus, Package } from 'lucide-react'
import Link from 'next/link'

const mockEstoque: Produto[] = [
  {
    id: "1",
    codigo: "PRD-001",
    descricao: "Mochila Executiva Premium",
    um: "UN",
    valor_custo: 100.00,
    valor_venda: 250.00,
    lucro_rs: 150.00,
    lucro_porcentagem: "150%",
    saldo_estoque: 10,
    custo_estoque_atual: 1000.00,
    fornecedor: "Distribuidora XPTO",
    cod_forn: "F-001"
  },
  {
    id: "2",
    codigo: "PRD-002",
    descricao: "Caneca de Cerâmica",
    um: "UN",
    valor_custo: 10.00,
    valor_venda: 35.00,
    lucro_rs: 25.00,
    lucro_porcentagem: "250%",
    saldo_estoque: 150,
    custo_estoque_atual: 1500.00,
    fornecedor: "Cerâmicas Brasil",
    cod_forn: "F-045"
  }
]

export default async function EstoquePage() {
  let produtos: Produto[] = mockEstoque
  
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    
    if (authData?.user) {
      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', authData.user.id).single()
      
      if (profile?.tenant_id) {
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .eq('ativo', true)
          .limit(50)
          
        if (!error && data && data.length > 0) {
      produtos = data.map(d => ({
        id: d.id,
        codigo: d.sku || "N/A",
        descricao: d.nome || "N/A",
        um: "UN",
        valor_custo: 0, // mapeamento dependente do banco
        valor_venda: d.preco_venda || 0,
        lucro_rs: 0,
        lucro_porcentagem: "0%",
        saldo_estoque: d.quantidade_estoque || 0,
        custo_estoque_atual: 0,
        fornecedor: "Não informado",
        cod_forn: "N/A"
      }))
        }
      }
    }
  } catch (error) {
    console.warn("⚠️ Usando mock data para o estoque.")
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Package className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo de Estoque</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Produtos</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de estoque, custos e lucratividade.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link 
            href="/estoque/novo"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/20 h-10 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Link>
        </div>
      </div>

      <EstoqueTable data={produtos} />
    </div>
  )
}
