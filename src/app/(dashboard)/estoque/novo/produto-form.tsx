'use client'

import { Save, ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

export function ProdutoForm() {
  return (
    <div className="max-w-3xl rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
      <form className="space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 border-b border-border/50 pb-2">
            <Package className="h-5 w-5 text-primary" /> Informações do Produto
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nome do Produto <span className="text-destructive">*</span></label>
              <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="Ex: Mochila Executiva Premium" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU (Código)</label>
              <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="PRD-001" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição Opcional</label>
            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="Detalhes adicionais sobre o produto..." />
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b border-border/50 pb-2">Valores e Estoque</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preço de Custo</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
                <input type="number" step="0.01" className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="0,00" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preço de Venda <span className="text-destructive">*</span></label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
                <input type="number" step="0.01" className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="0,00" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Qtd. Atual</label>
              <input type="number" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="0" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1" title="Quantidade mínima para disparar o alerta de Reordem">
                Alerta Mínimo
              </label>
              <input type="number" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="0" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
          <button type="button" className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-md h-10 px-5 py-2">
            <Save className="mr-2 h-4 w-4" /> Salvar Produto
          </button>
          <Link href="/estoque" className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all border border-input hover:bg-muted h-10 px-5 py-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
