'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, X, PackageOpen, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { searchProdutosAPI } from '@/app/actions/vendas'

interface Produto {
  id: string
  nome: string
  sku: string | null
  preco_venda: number
  quantidade_estoque?: number
  ncm?: string
  peso?: number
  um?: string
}

interface AdicionarItemModalProps {
  isOpen: boolean
  tipo: 'ORCAMENTO' | 'PEDIDO'
  listaProdutosInit: Produto[]
  onClose: () => void
  onAdicionar: (item: any) => void
}

export function AdicionarItemModal({ isOpen, tipo, listaProdutosInit, onClose, onAdicionar }: AdicionarItemModalProps) {
  const [busca, setBusca] = useState("")
  const [listaProdutos, setListaProdutos] = useState<Produto[]>([])
  
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [quantidade, setQuantidade] = useState<number | string>(1)
  const [desconto, setDesconto] = useState<number | string>(0)

  useEffect(() => {
    if (isOpen) {
      setListaProdutos(listaProdutosInit)
      setBusca("")
      setProdutoSelecionado(null)
      setQuantidade(1)
      setDesconto(0)
    }
  }, [isOpen, listaProdutosInit])

  if (!isOpen) return null

  // Filtra localmente primeiro
  const filtrados = listaProdutos.filter(p => 
    !busca || 
    (p.sku?.toLowerCase() || '').includes(busca.toLowerCase()) || 
    p.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const handleSelectProduto = (p: Produto) => {
    setProdutoSelecionado(p)
    setQuantidade(1)
    setDesconto(0)
    
    if (tipo === 'PEDIDO' && (p.quantidade_estoque || 0) <= 0) {
      toast.warning(`Atenção: O produto ${p.nome} está sem estoque!`)
    }
  }

  const handleBuscaRemota = async () => {
    if (busca.length > 2) {
      const res = await searchProdutosAPI(busca)
      if (res.length > 0) {
        setListaProdutos(prev => {
          const newP = res.filter(r => !prev.some(x => x.id === r.id))
          return [...prev, ...newP]
        })
      }
    }
  }

  const handleIncluir = () => {
    if (!produtoSelecionado) {
      toast.error("Selecione um produto primeiro.")
      return
    }
    
    const q = Number(quantidade) || 0
    if (q <= 0) {
      toast.error("A quantidade deve ser maior que zero.")
      return
    }

    onAdicionar({
      id: Date.now(),
      produto_id: produtoSelecionado.id,
      produto_sku: produtoSelecionado.sku || "",
      produto_nome: produtoSelecionado.nome,
      quantidade: q,
      unidade_medida: produtoSelecionado.um || "UN",
      preco_unitario: produtoSelecionado.preco_venda || 0,
      desconto_percentual: Number(desconto) || 0
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-xl border border-border/50 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <PackageOpen className="h-5 w-5 text-indigo-500" />
            Incluir item no {tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido'}
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BUSCA */}
        <div className="p-4 border-b border-border/50 bg-background flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar por código ou descrição (Digite e pressione Enter para buscar na nuvem...)" 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleBuscaRemota()
              }}
              className="w-full h-10 rounded-md border border-input bg-muted/20 pl-9 pr-4 text-sm focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
        </div>

        {/* GRID PRODUTOS (Lista) */}
        <div className="flex-1 overflow-auto bg-muted/10 min-h-[200px] border-b border-border/50">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-4 py-2 font-medium w-48">Código</th>
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium text-center w-20">U.M</th>
                <th className="px-4 py-2 font-medium text-right w-32">R$ Unit.</th>
                <th className="px-4 py-2 font-medium text-center w-24">Estoque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtrados.map(p => (
                <tr 
                  key={p.id} 
                  className={`cursor-pointer transition-colors ${
                    produtoSelecionado?.id === p.id 
                      ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' 
                      : 'hover:bg-muted/40'
                  }`}
                  onClick={() => handleSelectProduto(p)}
                >
                  <td className={`px-4 py-2 ${produtoSelecionado?.id === p.id ? 'font-semibold text-indigo-700' : 'font-medium text-muted-foreground'}`}>
                    {p.sku || '-'}
                  </td>
                  <td className={`px-4 py-2 ${produtoSelecionado?.id === p.id ? 'font-medium text-indigo-700' : ''}`}>
                    {p.nome}
                  </td>
                  <td className="px-4 py-2 text-center text-muted-foreground">
                    {p.um || 'UN'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {(p.preco_venda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      (p.quantidade_estoque || 0) <= 0 
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {p.quantidade_estoque || 0}
                    </span>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {busca.length > 2 
                      ? "Nenhum produto encontrado. Pressione Enter para buscar no banco de dados." 
                      : "Digite para buscar produtos..."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* RODAPÉ: FORMULÁRIO DE INCLUSÃO */}
        <div className="p-4 bg-background">
          {produtoSelecionado ? (
            <div className="flex flex-wrap md:flex-nowrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Produto Selecionado</label>
                <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/30 text-sm truncate font-medium">
                  {produtoSelecionado.nome}
                </div>
              </div>
              
              <div className="w-28">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">R$ Unitário</label>
                <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted/30 text-sm text-right text-muted-foreground">
                  {produtoSelecionado.preco_venda.toFixed(2)}
                </div>
              </div>

              <div className="w-24">
                <label className="text-xs font-medium text-indigo-600 mb-1 block">Qtd Pedido</label>
                <input 
                  type="number" 
                  min="0.01" 
                  step="1"
                  value={quantidade}
                  onChange={e => setQuantidade(e.target.value)}
                  onFocus={e => e.target.select()}
                  className="w-full h-10 px-3 rounded-md border-2 border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center font-bold text-indigo-700 shadow-sm"
                />
              </div>

              <div className="w-24">
                <label className="text-xs font-medium text-indigo-600 mb-1 block">Desc (%)</label>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="0.1"
                  value={desconto}
                  onChange={e => setDesconto(e.target.value)}
                  onFocus={e => e.target.select()}
                  className="w-full h-10 px-3 rounded-md border-2 border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-center font-bold text-indigo-700 shadow-sm"
                />
              </div>

              <button 
                onClick={handleIncluir}
                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-md transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Incluir Item
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center h-14 border border-dashed border-border/50 rounded-lg text-muted-foreground text-sm bg-muted/10">
              Selecione um produto na lista acima para informar a quantidade e incluir.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
