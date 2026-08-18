"use client"

import { useState } from "react"
import { FileText, ArrowLeft, Save, User, Calendar, Package, Plus, Trash2, Loader2, Printer, Download, Search } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { createOrcamento } from "@/app/actions/orcamentos"

type ProdutoOrcamento = {
  codigo: string
  descricao: string
  qtde: number
  um: string
  valorUnit: number
  descPerc: number
}

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<ProdutoOrcamento[]>([
    { codigo: "", descricao: "", qtde: 1, um: "UN", valorUnit: 0, descPerc: 0 }
  ])

  const handleAddProduto = () => {
    setProdutos([...produtos, { codigo: "", descricao: "", qtde: 1, um: "UN", valorUnit: 0, descPerc: 0 }])
  }

  const handleRemoveProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index))
  }

  const handleProdutoChange = (index: number, field: keyof ProdutoOrcamento, value: string | number) => {
    const newProdutos = [...produtos]
    newProdutos[index] = { ...newProdutos[index], [field]: value } as any
    setProdutos(newProdutos)
  }

  const calcularSubtotal = (p: ProdutoOrcamento) => {
    const bruto = p.qtde * p.valorUnit;
    const desconto = bruto * (p.descPerc / 100);
    return bruto - desconto;
  }

  const calcularTotal = () => {
    return produtos.reduce((acc, p) => acc + calcularSubtotal(p), 0)
  }

  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Integração futura via payload com Supabase
    alert("Função de salvar/gerar pedido chamada (Simulação)!")
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen bg-muted/10">
      {/* Action Bar (Like the right panel in Excel) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <FileText className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Formulário de Pedido</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Novo Pedido / Orçamento</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-border/50 bg-background hover:bg-muted h-10 px-4 py-2">
            <Download className="mr-2 h-4 w-4 text-indigo-500" /> Gerar PDF
          </button>
          <button type="button" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-border/50 bg-background hover:bg-muted h-10 px-4 py-2">
            <Printer className="mr-2 h-4 w-4 text-indigo-500" /> Imprimir
          </button>
          <Link href="/orcamentos" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-border/50 bg-background hover:bg-muted h-10 px-4 py-2 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar / Sair
          </Link>
          <button 
            type="submit" 
            form="pedido-form"
            disabled={isPending} 
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 h-10 px-6 py-2 ml-2"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <form id="pedido-form" onSubmit={handleSubmit}>
          
          {/* Cabeçalho do Pedido (Empresa e Infos do Pedido) */}
          <div className="flex flex-col md:flex-row justify-between p-6 border-b border-border/50 bg-white dark:bg-card">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-black text-indigo-900 tracking-tighter dark:text-indigo-400">
                JC2B <span className="font-normal text-muted-foreground text-2xl tracking-normal">PARTS</span>
              </div>
              <div className="text-xs text-muted-foreground border-l pl-4 border-border/50">
                <p>Ana Dias Guimarães, 309 - Dois Córregos - Piracicaba/SP</p>
                <p className="text-emerald-600 font-medium my-0.5">📱 19 97137-3709</p>
                <p>vendas.jc2bparts@outlook.com</p>
              </div>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col justify-end text-right space-y-2 min-w-[200px]">
              <div className="text-3xl font-bold text-foreground">Nº 2063</div>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground items-center">
                <span className="font-medium text-right">Data emissão:</span>
                <input type="date" className="h-7 px-2 rounded border border-border/50 bg-transparent text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
                
                <span className="font-medium text-right">Data entrega:</span>
                <input type="date" className="h-7 px-2 rounded border border-border/50 bg-transparent text-sm" />
                
                <span className="font-medium text-right">Vendedor:</span>
                <input type="text" className="h-7 px-2 rounded border border-border/50 bg-transparent text-sm" placeholder="Nome Vendedor" />
              </div>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="p-0 border-b border-border/50">
            <div className="bg-muted/40 p-2 text-center border-b border-border/50">
              <h3 className="font-bold text-sm tracking-widest text-muted-foreground uppercase">Dados do Cliente</h3>
            </div>
            <div className="p-6 grid gap-4">
              <div className="flex justify-between items-end gap-4">
                <div className="w-24">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Cód:</label>
                  <input type="text" className="flex h-9 w-full rounded-md border-b-2 border-border/50 bg-transparent px-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors" placeholder="C-000" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Nome do Cliente:</label>
                  <input type="text" className="flex h-9 w-full rounded-md border-b-2 border-border/50 bg-transparent px-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors font-medium" placeholder="Razão Social ou Nome Completo" required />
                </div>
                <button type="button" className="h-9 px-4 rounded bg-indigo-500/10 text-indigo-600 font-medium text-sm flex items-center gap-2 hover:bg-indigo-500/20 transition-colors">
                  <Search className="h-4 w-4" /> Buscar Cliente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">CPF/CNPJ:</label>
                  <input type="text" className="flex h-9 w-full rounded-md border-b-2 border-border/50 bg-transparent px-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Inscrição Estadual:</label>
                  <input type="text" className="flex h-9 w-full rounded-md border-b-2 border-border/50 bg-transparent px-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Rua, Nº:</label>
                  <input type="text" className="flex h-9 w-full rounded-md border-b-2 border-border/50 bg-transparent px-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Bairro:</label>
                  <input type="text" className="flex h-9 w-full rounded-md border-b-2 border-border/50 bg-transparent px-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">CEP:</label>
                  <input type="text" className="flex h-9 w-full rounded-md border-b-2 border-border/50 bg-transparent px-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Cidade/UF:</label>
                  <input type="text" className="flex h-9 w-full rounded-md border-b-2 border-border/50 bg-transparent px-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">Contato:</label>
                  <input type="text" className="flex h-9 w-full rounded-md border-b-2 border-border/50 bg-transparent px-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground uppercase">E-mail:</label>
                  <input type="email" className="flex h-9 w-full rounded-md border-b-2 border-border/50 bg-transparent px-2 text-sm focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* Produtos */}
          <div className="p-0">
            <div className="bg-muted/40 p-2 text-center border-b border-border/50">
              <h3 className="font-bold text-sm tracking-widest text-muted-foreground uppercase">Produtos</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background border-b border-border/50">
                  <tr>
                    <th className="h-10 px-2 text-center font-bold text-xs uppercase text-muted-foreground w-[50px]">Item</th>
                    <th className="h-10 px-2 text-left font-bold text-xs uppercase text-muted-foreground w-[120px]">Código</th>
                    <th className="h-10 px-2 text-left font-bold text-xs uppercase text-muted-foreground">Descrição</th>
                    <th className="h-10 px-2 text-center font-bold text-xs uppercase text-muted-foreground w-[80px]">Qtde</th>
                    <th className="h-10 px-2 text-center font-bold text-xs uppercase text-muted-foreground w-[70px]">U.M</th>
                    <th className="h-10 px-2 text-right font-bold text-xs uppercase text-muted-foreground w-[130px]">Valor unit.</th>
                    <th className="h-10 px-2 text-center font-bold text-xs uppercase text-muted-foreground w-[80px]">Desc %</th>
                    <th className="h-10 px-2 text-right font-bold text-xs uppercase text-muted-foreground w-[130px]">Sub total R$</th>
                    <th className="h-10 px-2 w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 border-b border-border/50">
                  {produtos.map((produto, index) => (
                    <tr key={index} className="hover:bg-muted/20 transition-colors">
                      <td className="p-1 text-center font-medium text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="p-1">
                        <input 
                          value={produto.codigo} 
                          onChange={(e) => handleProdutoChange(index, "codigo", e.target.value)}
                          className="h-8 w-full rounded border-0 bg-transparent px-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:bg-background border-b border-dashed border-border"
                        />
                      </td>
                      <td className="p-1">
                        <input 
                          value={produto.descricao} 
                          onChange={(e) => handleProdutoChange(index, "descricao", e.target.value)}
                          className="h-8 w-full rounded border-0 bg-transparent px-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:bg-background border-b border-dashed border-border font-medium"
                        />
                      </td>
                      <td className="p-1">
                        <input 
                          type="number" min="1"
                          value={produto.qtde} 
                          onChange={(e) => handleProdutoChange(index, "qtde", parseInt(e.target.value) || 0)}
                          className="h-8 w-full text-center rounded border-0 bg-transparent px-1 text-sm focus:ring-1 focus:ring-indigo-500 focus:bg-background border-b border-dashed border-border"
                        />
                      </td>
                      <td className="p-1">
                        <input 
                          value={produto.um} 
                          onChange={(e) => handleProdutoChange(index, "um", e.target.value)}
                          className="h-8 w-full text-center rounded border-0 bg-transparent px-1 text-sm focus:ring-1 focus:ring-indigo-500 focus:bg-background border-b border-dashed border-border uppercase"
                        />
                      </td>
                      <td className="p-1 relative">
                        <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">R$</span>
                        <input 
                          type="number" step="0.01" min="0"
                          value={produto.valorUnit} 
                          onChange={(e) => handleProdutoChange(index, "valorUnit", parseFloat(e.target.value) || 0)}
                          className="h-8 w-full text-right rounded border-0 bg-transparent pl-6 pr-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:bg-background border-b border-dashed border-border"
                        />
                      </td>
                      <td className="p-1 relative">
                        <input 
                          type="number" step="0.1" min="0" max="100"
                          value={produto.descPerc} 
                          onChange={(e) => handleProdutoChange(index, "descPerc", parseFloat(e.target.value) || 0)}
                          className="h-8 w-full text-center rounded border-0 bg-transparent pr-4 pl-1 text-sm focus:ring-1 focus:ring-indigo-500 focus:bg-background border-b border-dashed border-border text-orange-500"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-orange-500">%</span>
                      </td>
                      <td className="p-1 text-right pr-3 font-semibold text-foreground">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(calcularSubtotal(produto))}
                      </td>
                      <td className="p-1 text-center">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveProduto(index)}
                          className="h-7 w-7 inline-flex items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between p-4 bg-muted/10 gap-4">
              <button 
                type="button" 
                onClick={handleAddProduto}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 h-10 px-6"
              >
                <Plus className="h-4 w-4 mr-2" />
                Inserir Linha (Item)
              </button>
              
              <div className="flex items-center justify-end bg-card border border-border/50 rounded-lg px-6 py-3 shadow-sm min-w-[300px]">
                <div className="text-right">
                  <span className="block text-xs font-bold uppercase text-muted-foreground tracking-wider">Total do Pedido</span>
                  <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(calcularTotal())}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
