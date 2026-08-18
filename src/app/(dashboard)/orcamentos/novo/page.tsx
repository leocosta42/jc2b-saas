"use client"

import { useState } from "react"
import { FileText, ArrowLeft, Save, User, MapPin, Calendar, Package, Plus, Trash2, Calculator, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { createOrcamento } from "@/app/actions/orcamentos"

type ProdutoOrcamento = {
  codigo: string
  descricao: string
  qtde: number
  valorUnit: number
}

export default function NovoOrcamentoPage() {
  const router = useRouter()
  const [produtos, setProdutos] = useState<ProdutoOrcamento[]>([
    { codigo: "", descricao: "", qtde: 1, valorUnit: 0 }
  ])

  const handleAddProduto = () => {
    setProdutos([...produtos, { codigo: "", descricao: "", qtde: 1, valorUnit: 0 }])
  }

  const handleRemoveProduto = (index: number) => {
    setProdutos(produtos.filter((_, i) => i !== index))
  }

  const handleProdutoChange = (index: number, field: keyof ProdutoOrcamento, value: string | number) => {
    const newProdutos = [...produtos]
    newProdutos[index] = { ...newProdutos[index], [field]: value }
    setProdutos(newProdutos)
  }

  const calcularTotal = () => {
    return produtos.reduce((acc, p) => acc + (p.qtde * p.valorUnit), 0)
  }

  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const payload = {
      cliente_nome: formData.get("cliente_nome") as string,
      cif_fob: formData.get("cif_fob") as string,
      data_emissao: formData.get("data_emissao") as string,
      data_entrega: formData.get("data_entrega") as string,
      produtos
    }

    startTransition(async () => {
      const res = await createOrcamento(payload)
      if (res.error) {
        alert(res.error)
      } else {
        router.push("/orcamentos")
        router.refresh()
      }
    })
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link href="/orcamentos" className="hover:text-foreground transition-colors flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </div>
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <FileText className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo Comercial</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Gerar Pedido / Orçamento</h1>
        </div>
      </div>

      <div className="max-w-5xl">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            
            <div className="grid gap-6 md:grid-cols-2">
              {/* Dados do Cliente */}
              <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
                <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                  <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <User className="h-5 w-5 text-indigo-500" />
                    Dados do Cliente
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="cliente_nome" className="text-sm font-medium leading-none">Nome</label>
                    <input id="cliente_nome" name="cliente_nome" placeholder="Selecione ou digite o cliente..." className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="contato" className="text-sm font-medium leading-none">Contato</label>
                      <input id="contato" name="contato" placeholder="Nome do contato" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium leading-none">E-mail</label>
                      <input id="email" name="email" type="email" placeholder="email@cliente.com" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr,100px] gap-4">
                    <div className="space-y-2">
                      <label htmlFor="bairro" className="text-sm font-medium leading-none">Bairro</label>
                      <input id="bairro" name="bairro" placeholder="Bairro" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cep" className="text-sm font-medium leading-none">CEP</label>
                      <input id="cep" name="cep" placeholder="00000-000" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes do Pedido/Orçamento */}
              <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
                <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                  <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <Calendar className="h-5 w-5 text-indigo-500" />
                    Detalhes da Negociação
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="numero" className="text-sm font-medium leading-none">Nº Pedido/Orçamento</label>
                      <input id="numero" value="Gerado auto." readOnly className="flex h-10 w-full rounded-md border border-input bg-muted font-bold text-indigo-500 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="cif_fob" className="text-sm font-medium leading-none">Frete (CIF/FOB)</label>
                      <input id="cif_fob" name="cif_fob" defaultValue="CIF" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="data_emissao" className="text-sm font-medium leading-none">Data de Emissão</label>
                      <input id="data_emissao" name="data_emissao" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="data_entrega" className="text-sm font-medium leading-none">Data de Entrega</label>
                      <input id="data_entrega" name="data_entrega" type="date" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="insc_estadual" className="text-sm font-medium leading-none">Inscrição Estadual</label>
                    <input id="insc_estadual" name="insc_estadual" placeholder="Isento ou Nº" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Produtos */}
            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-border/50 bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <Package className="h-5 w-5 text-indigo-500" />
                    Produtos
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Adicione os itens deste orçamento.</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleAddProduto}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </button>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 border-b border-border/50">
                    <tr>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[120px]">Código</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Descrição</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[100px]">Qtde</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[150px]">Valor Unit. (R$)</th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground w-[150px]">Total (R$)</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {produtos.map((produto, index) => (
                      <tr key={index}>
                        <td className="p-2">
                          <input 
                            value={produto.codigo} 
                            onChange={(e) => handleProdutoChange(index, "codigo", e.target.value)}
                            placeholder="PRO0001" 
                            className="flex h-8 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            value={produto.descricao} 
                            onChange={(e) => handleProdutoChange(index, "descricao", e.target.value)}
                            placeholder="Descrição do item" 
                            className="flex h-8 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            min="1"
                            value={produto.qtde} 
                            onChange={(e) => handleProdutoChange(index, "qtde", parseInt(e.target.value) || 0)}
                            className="flex h-8 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="number" 
                            step="0.01"
                            min="0"
                            value={produto.valorUnit} 
                            onChange={(e) => handleProdutoChange(index, "valorUnit", parseFloat(e.target.value) || 0)}
                            className="flex h-8 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          />
                        </td>
                        <td className="p-2 text-right font-medium text-muted-foreground">
                          R$ {(produto.qtde * produto.valorUnit).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button 
                            type="button" 
                            onClick={() => handleRemoveProduto(index)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-destructive h-8 w-8 text-muted-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end border-t border-border/50 bg-muted/20 p-4">
                <div className="flex items-center gap-4 text-xl">
                  <span className="text-muted-foreground">Total Geral:</span>
                  <span className="font-bold text-emerald-500">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(calcularTotal())}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link 
                href="/orcamentos"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border/50 hover:bg-muted/50 h-10 px-4 py-2"
                aria-disabled={isPending}
              >
                Cancelar
              </Link>
              <button 
                type="submit" 
                disabled={isPending} 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-indigo-500 hover:bg-indigo-600 text-white shadow-md shadow-indigo-500/20 h-10 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isPending ? "Gerando..." : "Gerar Pedido/Orçamento"}
              </button>
            </div>
            
          </div>
        </form>
      </div>
    </div>
  )
}
