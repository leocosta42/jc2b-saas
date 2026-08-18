import { createClient } from '@/lib/supabase/server'
import { PedidoForm } from './pedido-form'

export default async function NovoPedidoPage() {
  let clientes = []
  let produtos = []
  let vendedores = []

  try {
    const supabase = createClient()
    
    // Tenta buscar do banco real
    const [resClientes, resProdutos, resVendedores] = await Promise.all([
      supabase.from('clientes').select('id, nome').order('nome'),
      supabase.from('produtos').select('id, nome, preco_venda, quantidade_estoque').order('nome'),
      supabase.from('vendedores').select('id, nome').order('nome')
    ])

    if (resClientes.data) clientes = resClientes.data
    if (resProdutos.data) produtos = resProdutos.data
    if (resVendedores.data) vendedores = resVendedores.data

  } catch (error) {
    // Se o supabase não estiver configurado, usa mock data para visualização
  }

  // Mock data fallback se o banco estiver vazio ou desconectado
  if (clientes.length === 0) {
    clientes = [
      { id: "1", nome: "Tech Solutions Brasil" },
      { id: "2", nome: "Roberto Almeida" },
      { id: "3", nome: "Comercial Martins" },
    ]
  }

  if (produtos.length === 0) {
    produtos = [
      { id: "1", nome: "Uniforme Esportivo Completo", preco_venda: 145.00, quantidade_estoque: 150 },
      { id: "2", nome: "Mochila Executiva Premium", preco_venda: 289.90, quantidade_estoque: 4 },
      { id: "3", nome: "Caneca de Cerâmica Branca", preco_venda: 25.00, quantidade_estoque: 80 },
    ]
  }
  
  if (vendedores.length === 0) {
    vendedores = [
      { id: "1", nome: "Carlos Sales" },
      { id: "2", nome: "Ana Costa" },
    ]
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Novo Pedido</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Preencha os detalhes abaixo para registrar uma nova venda.
        </p>
      </div>
      
      <PedidoForm 
        clientes={clientes} 
        produtos={produtos} 
        vendedores={vendedores} 
      />
    </div>
  )
}
