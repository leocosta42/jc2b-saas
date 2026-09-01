'use client'

import { Save, ArrowLeft, Package, Box, DollarSign, Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createProduto, updateProduto } from '@/app/actions/produtos'

export function ProdutoForm({ 
  fornecedores, 
  nextSku,
  produtoCopiar,
  isEdit,
  editId
}: { 
  fornecedores: any[], 
  nextSku: string,
  produtoCopiar?: any,
  isEdit?: boolean,
  editId?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [codigo, setCodigo] = useState(isEdit ? (produtoCopiar?.sku || nextSku) : (produtoCopiar ? nextSku : nextSku))
  const [umValue, setUmValue] = useState(produtoCopiar?.um || "UN")
  const [modalUmOpen, setModalUmOpen] = useState(false)
  const [custo, setCusto] = useState(produtoCopiar?.preco_custo || 0)
  const [venda, setVenda] = useState(produtoCopiar?.preco_venda || 0)

  // Peso logic
  const calcInitialPeso = (pesoKg: number | undefined) => {
    if (!pesoKg) return { qtd: "", uni: "KG" }
    if (pesoKg < 1 && pesoKg > 0) {
      if (pesoKg < 0.001) return { qtd: pesoKg * 1000000, uni: "MG" }
      return { qtd: pesoKg * 1000, uni: "G" }
    }
    return { qtd: pesoKg, uni: "KG" }
  }
  const initPeso = calcInitialPeso(produtoCopiar?.peso)
  const [pesoQtd, setPesoQtd] = useState<number | string>(initPeso.qtd)
  const [pesoUni, setPesoUni] = useState(initPeso.uni)

  const calcPesoKg = (qtd: number, uni: string) => {
    if (uni === 'MG') return qtd / 1000000
    if (uni === 'G') return qtd / 1000
    return qtd
  }
  const pesoFinalKg = calcPesoKg(Number(pesoQtd) || 0, pesoUni)

  const lucroReais = venda - custo
  const lucroPercent = custo > 0 ? (lucroReais / custo) * 100 : (venda > 0 ? 100 : 0)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      let res
      if (isEdit && editId) {
        res = await updateProduto(editId, formData)
      } else {
        res = await createProduto(formData)
      }
      
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
            <div className="relative">
              <input 
                name="um" 
                type="text" 
                value={umValue}
                onChange={(e) => setUmValue(e.target.value.toUpperCase())}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-3 pr-10 py-2 text-sm uppercase focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" 
                placeholder="UN, CX, KG..." 
              />
              <button 
                type="button"
                onClick={() => setModalUmOpen(true)}
                className="absolute right-2 top-2 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-indigo-500 transition-colors"
                title="Consultar U.M"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">NCM Fiscal</label>
            <input name="ncm" type="text" defaultValue={produtoCopiar?.ncm || ""} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="Ex: 7318.15.00" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Peso Unitário</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                step="0.001" 
                min="0"
                value={pesoQtd} 
                onChange={e => {
                  const val = Number(e.target.value)
                  if (val >= 0) setPesoQtd(e.target.value)
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" 
                placeholder="0" 
              />
              <select 
                value={pesoUni}
                onChange={e => setPesoUni(e.target.value)}
                className="flex h-10 w-24 rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
              >
                <option value="KG">KG</option>
                <option value="G">G</option>
                <option value="MG">MG</option>
              </select>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Convertido p/ Frete: <b>{pesoFinalKg.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 6 })} KG</b>
            </p>
            <input type="hidden" name="peso" value={pesoFinalKg} />
          </div>
          <div className="space-y-2 lg:col-span-1">
            <label htmlFor="bloqueado" className="text-sm font-medium text-red-500">Status de Bloqueio</label>
            <select id="bloqueado" name="bloqueado" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" defaultValue={produtoCopiar?.bloqueado ? "true" : "false"}>
              <option value="false">Ativo / Liberado</option>
              <option value="true">Bloqueado</option>
            </select>
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
              <input name="preco_custo" type="number" step="0.01" min="0" value={custo || ''} onChange={(e) => {
                const val = Number(e.target.value)
                if (val >= 0) setCusto(val)
              }} className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Valor Venda R$ <span className="text-destructive">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">R$</span>
              <input name="preco_venda" type="number" step="0.01" min="0" value={venda || ''} onChange={(e) => {
                const val = Number(e.target.value)
                if (val >= 0) setVenda(val)
              }} className="flex h-10 w-full rounded-md border border-input bg-background/50 pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0.00" required />
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
            <input name="quantidade_estoque" type="number" min="0" defaultValue={isEdit ? (produtoCopiar?.quantidade_estoque ?? 0) : 0} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500" placeholder="0" onInput={(e) => {
              if (Number(e.currentTarget.value) < 0) e.currentTarget.value = '0'
            }} />
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

      {/* Modal U.M */}
      {modalUmOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-lg shadow-2xl w-full max-w-sm border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Search className="h-5 w-5 text-indigo-500" />
                Selecione a U.M
              </h2>
              <button onClick={() => setModalUmOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="p-2 grid grid-cols-2 gap-2 bg-background">
              {[
                { sigla: "UN", desc: "Unidade" },
                { sigla: "CX", desc: "Caixa" },
                { sigla: "PC", desc: "Peça" },
                { sigla: "KG", desc: "Quilograma" },
                { sigla: "M", desc: "Metro" },
                { sigla: "LT", desc: "Litro" },
                { sigla: "PAR", desc: "Par" },
                { sigla: "RL", desc: "Rolo" }
              ].map(um => (
                <button
                  key={um.sigla}
                  type="button"
                  onClick={() => {
                    setUmValue(um.sigla)
                    setModalUmOpen(false)
                  }}
                  className="flex flex-col items-center justify-center p-3 border border-border/50 rounded-lg hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all group"
                >
                  <span className="font-bold text-lg">{um.sigla}</span>
                  <span className="text-xs text-muted-foreground group-hover:text-white/70">{um.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
