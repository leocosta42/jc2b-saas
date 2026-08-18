'use client'

import { useState } from 'react'
import { Plus, Trash2, ShoppingBag, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type ItemPedido = {
  id: string
  produto_id: string
  quantidade: number
  preco_unitario: number
}

interface PedidoFormProps {
  clientes: { id: string; nome: string }[]
  produtos: { id: string; nome: string; preco_venda: number; quantidade_estoque: number }[]
  vendedores: { id: string; nome: string }[]
}

export function PedidoForm({ clientes, produtos, vendedores }: PedidoFormProps) {
  const [itens, setItens] = useState<ItemPedido[]>([])
  
  const adicionarItem = () => {
    setItens([...itens, { id: crypto.randomUUID(), produto_id: '', quantidade: 1, preco_unitario: 0 }])
  }

  const removerItem = (id: string) => {
    setItens(itens.filter(i => i.id !== id))
  }

  const atualizarItem = (id: string, campo: keyof ItemPedido, valor: any) => {
    setItens(itens.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [campo]: valor }
        // Se mudou o produto, atualiza o preço unitário automaticamente
        if (campo === 'produto_id') {
          const produtoSelecionado = produtos.find(p => p.id === valor)
          if (produtoSelecionado) {
            newItem.preco_unitario = produtoSelecionado.preco_venda
          }
        }
        return newItem
      }
      return item
    }))
  }

  const totalPedido = itens.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0)

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Coluna Principal: Formulário e Itens */}
      <div className="md:col-span-2 space-y-6">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Informações Principais</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cliente</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">Selecione um cliente...</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Vendedor (Opcional)</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">Selecione um vendedor...</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" /> 
              Itens do Pedido
            </h3>
            <button 
              onClick={adicionarItem}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Produto
            </button>
          </div>

          {itens.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
              <p>Nenhum produto adicionado ao pedido.</p>
              <p className="text-sm mt-1">Clique no botão acima para inserir itens.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {itens.map((item, index) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-end p-4 rounded-lg bg-muted/30 border border-border/30">
                  <div className="w-full sm:flex-1 space-y-2">
                    <label className="text-xs font-medium">Produto</label>
                    <select 
                      value={item.produto_id}
                      onChange={(e) => atualizarItem(item.id, 'produto_id', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="">Selecione...</option>
                      {produtos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} (Estoque: {p.quantidade_estoque})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full sm:w-24 space-y-2">
                    <label className="text-xs font-medium">Qtd</label>
                    <input 
                      type="number" 
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => atualizarItem(item.id, 'quantidade', parseInt(e.target.value) || 1)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    />
                  </div>
                  <div className="w-full sm:w-32 space-y-2">
                    <label className="text-xs font-medium">R$ Unitário</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={item.preco_unitario}
                      onChange={(e) => atualizarItem(item.id, 'preco_unitario', parseFloat(e.target.value) || 0)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    />
                  </div>
                  <div className="w-full sm:w-28 space-y-2">
                    <label className="text-xs font-medium">Subtotal</label>
                    <div className="h-9 flex items-center px-3 font-semibold text-primary bg-primary/10 rounded-md">
                      R$ {(item.quantidade * item.preco_unitario).toFixed(2)}
                    </div>
                  </div>
                  <button 
                    onClick={() => removerItem(item.id)}
                    className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coluna Lateral: Resumo */}
      <div className="space-y-6">
        <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm sticky top-6">
          <h3 className="text-lg font-semibold mb-4 border-b pb-2">Resumo do Pedido</h3>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quantidade de Itens</span>
              <span className="font-medium">{itens.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">R$ {totalPedido.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Descontos</span>
              <span className="font-medium text-emerald-500">R$ 0,00</span>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-lg text-primary">R$ {totalPedido.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none bg-primary text-primary-foreground shadow-md hover:bg-primary/90 h-11 px-4 py-2">
              <Save className="mr-2 h-4 w-4" />
              Finalizar Pedido
            </button>
            <Link 
              href="/pedidos"
              className="w-full flex items-center justify-center rounded-lg text-sm font-medium transition-all border border-input hover:bg-muted h-11 px-4 py-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancelar
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
