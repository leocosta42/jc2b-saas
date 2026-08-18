'use client'

import { Save, ArrowLeft, Package, Box, DollarSign, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createProduto } from '@/app/actions/produtos'

export function ProdutoForm({ 
  fornecedores, 
  nextSku,
  produtoCopiar 
}: { 
  fornecedores: any[], 
  nextSku: string,
  produtoCopiar?: any
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [codigo, setCodigo] = useState(nextSku)
  const [custo, setCusto] = useState(produtoCopiar?.preco_custo || 0)
  const [venda, setVenda] = useState(produtoCopiar?.preco_venda || 0)

  const lucroReais = venda - custo
  const lucroPercent = custo > 0 ? (lucroReais / custo) * 100 : (venda > 0 ? 100 : 0)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createProduto(formData)
      if (res.error) {
        alert(res.error)
      } else {
        router.push("/estoque")
        router.refresh()
      }
    })
  }

  return (
    <div className="max-w-4xl rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-0">
        
        {/* Identificação */}
        <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Package className="h-5 w-5 text-indigo-500" />
            Dados do Produto
          </h3>
        </div>
        <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Código / SKU</label>
              <button 
                type="button" 
                onClick={() => setCodigo(nextSku)}
                className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
              >
                Gerar Sequencial
              </button>
            </div>
            <input 
              name="codigo" 
              type="text" 
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" 
              placeholder="Ex: PROD001" 
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium">Descrição <span className="text-destructive">*</span></label>
            <input name="descricao" type="text" defaultValue={produtoCopiar?.nome || ''} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="Nome / Descrição do Produto" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">U.M (Unid. de Medida)</label>
            <input name="um" type="text" defaultValue={produtoCopiar?.descricao || "UN"} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="UN, CX, KG..." />
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
              <input name="preco_custo" type="number" step="0.01" value={custo || ''} onChange={(e) => setCusto(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor Venda R$ <span className="text-destructive">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
              <input name="preco_venda" type="number" step="0.01" value={venda || ''} onChange={(e) => setVenda(Number(e.target.value))} className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0.00" required />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lucro R$</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
              <input type="text" readOnly value={lucroReais.toFixed(2)} className="flex h-10 w-full rounded-md border border-input bg-muted/50 pl-9 pr-3 py-2 text-sm text-emerald-500 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Lucro %</label>
            <input type="text" readOnly value={`${lucroPercent.toFixed(1)}%`} className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-emerald-500 font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" />
          </div>
        </div>

        {/* Estoque e Fornecedor */}
        <div className="p-6 pb-4 border-y border-border/50 bg-muted/20 mt-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Box className="h-5 w-5 text-indigo-500" />
            Estoque & Fornecedor
          </h3>
        </div>
        <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Saldo Estoque</label>
            <input name="quantidade_estoque" type="number" defaultValue={produtoCopiar ? 0 : "0"} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0" />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <label className="text-sm font-medium">Pesquisar Fornecedor</label>
            <select name="fornecedor_id" defaultValue={produtoCopiar?.fornecedor_id || ""} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500">
              <option value="">Nenhum fornecedor vinculado</option>
              {fornecedores.map(f => (
                <option key={f.id} value={f.id}>
                  {f.codigo ? `[${f.codigo}] ` : ''}{f.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 p-6 border-t border-border/50 bg-muted/10">
          <Link href="/estoque" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-border/50 hover:bg-muted/50 h-10 px-5 py-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
          </Link>
          <button type="submit" disabled={isPending} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20 h-10 px-5 py-2 disabled:opacity-50">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isPending ? "Salvando..." : "Salvar Produto"}
          </button>
        </div>
      </form>
    </div>
  )
}
