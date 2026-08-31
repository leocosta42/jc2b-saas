'use client'

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'

interface ItemPedido {
  id: any
  produto_id: string
  produto_sku: string
  produto_nome: string
  quantidade: number
  unidade_medida: string
  preco_unitario: number
  desconto_percentual: number
}

interface EditarItemModalProps {
  isOpen: boolean
  item: ItemPedido | null
  onClose: () => void
  onSalvar: (item: ItemPedido) => void
}

export function EditarItemModal({ isOpen, item, onClose, onSalvar }: EditarItemModalProps) {
  const [quantidade, setQuantidade] = useState<number | string>(1)
  const [preco, setPreco] = useState<number | string>(0)
  const [desconto, setDesconto] = useState<number | string>(0)

  useEffect(() => {
    if (item && isOpen) {
      setQuantidade(item.quantidade)
      setPreco(item.preco_unitario)
      setDesconto(item.desconto_percentual)
    }
  }, [item, isOpen])

  if (!isOpen || !item) return null

  const q = Number(quantidade) || 0
  const p = Number(preco) || 0
  const d = Number(desconto) || 0

  const valorOriginal = p * q
  const valorDesconto = valorOriginal * (d / 100)
  const valorTotal = valorOriginal - valorDesconto

  const handleSalvar = () => {
    onSalvar({
      ...item,
      quantidade: q,
      preco_unitario: p,
      desconto_percentual: d
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-md rounded-xl border border-border/50 shadow-xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <h2 className="font-semibold">Editar Item do Pedido</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-sm font-semibold text-muted-foreground">Produto selecionado</p>
            <p className="text-lg font-medium text-foreground">{item.produto_nome || 'Produto não selecionado'}</p>
            {item.produto_sku && <p className="text-xs text-muted-foreground">SKU: {item.produto_sku}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <input
                type="number"
                min="0"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preço Unitário (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex justify-between">
              <span>Desconto (%)</span>
              {d > 0 && <span className="text-emerald-500 font-bold">- R$ {valorDesconto.toFixed(2)}</span>}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20">
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
              <span>Subtotal:</span>
              <span>R$ {valorOriginal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-lg text-emerald-600 dark:text-emerald-400 border-t border-emerald-500/20 pt-2 mt-2">
              <span>Total Líquido:</span>
              <span>R$ {valorTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border/50 bg-muted/20 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-md border border-border/50 hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors flex items-center gap-2 shadow-md shadow-indigo-500/20"
          >
            <Check className="h-4 w-4" />
            Confirmar Alteração
          </button>
        </div>
      </div>
    </div>
  )
}
