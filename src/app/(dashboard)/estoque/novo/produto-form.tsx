'use client'

import { Save, ArrowLeft, Package, Box, DollarSign } from 'lucide-react'
import Link from 'next/link'

export function ProdutoForm() {
  return (
    <div className="max-w-4xl rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
      <form className="space-y-0">
        
        {/* Identificação */}
        <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Package className="h-5 w-5 text-indigo-500" />
            Dados do Produto
          </h3>
        </div>
        <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Código</label>
            <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="Código" />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium">Descrição <span className="text-destructive">*</span></label>
            <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="Nome / Descrição do Produto" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">U.M (Unid. de Medida)</label>
            <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="UN, CX, KG..." />
          </div>
        </div>

        {/* Valores */}
        <div className="p-6 pb-4 border-y border-border/50 bg-muted/20 mt-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <DollarSign className="h-5 w-5 text-indigo-500" />
            Precificação
          </h3>
        </div>
        <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor Custo R$</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
              <input type="number" step="0.01" className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0,00" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor Venda R$</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
              <input type="number" step="0.01" className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0,00" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lucro R$</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
              <input type="number" step="0.01" readOnly className="flex h-10 w-full rounded-md border border-input bg-muted/50 pl-9 pr-3 py-2 text-sm text-emerald-500 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0,00" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lucro %</label>
            <input type="text" readOnly className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-emerald-500 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0%" />
          </div>
        </div>

        {/* Estoque e Fornecedor */}
        <div className="p-6 pb-4 border-y border-border/50 bg-muted/20 mt-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Box className="h-5 w-5 text-indigo-500" />
            Estoque & Fornecedor
          </h3>
        </div>
        <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Saldo Estoque</label>
            <input type="number" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Custo Atual R$</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
              <input type="number" step="0.01" readOnly className="flex h-10 w-full rounded-md border border-input bg-muted/50 pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0,00" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cód. Fornecedor</label>
            <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="Código Forn." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fornecedor</label>
            <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="Nome do Fornecedor" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t border-border/50 bg-muted/10">
          <Link href="/estoque" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-border/50 hover:bg-muted/50 h-10 px-5 py-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
          </Link>
          <button type="button" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20 h-10 px-5 py-2">
            <Save className="mr-2 h-4 w-4" /> Salvar Produto
          </button>
        </div>
      </form>
    </div>
  )
}
