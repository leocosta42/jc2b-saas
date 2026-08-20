"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createDocumento, updateDocumento } from "@/app/actions/vendas"
import { ArrowLeft, Save, Plus, Trash2, Calendar, FileText, User, ShoppingCart, Calculator, Tag, Loader2, Search } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Props {
  tipo: 'ORCAMENTO' | 'PEDIDO'
  dadosForm: {
    clientes: any[]
    vendedores: any[]
    produtos: any[]
  }
  isEdit?: boolean
  pedidoEdit?: any
}

export function FormularioVenda({ tipo, dadosForm, isEdit, pedidoEdit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Header
  const [dataEmissao, setDataEmissao] = useState(
    pedidoEdit?.data_emissao ? new Date(pedidoEdit.data_emissao).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  )
  const [dataEntrega, setDataEntrega] = useState(
    pedidoEdit?.data_entrega ? new Date(pedidoEdit.data_entrega).toISOString().split('T')[0] : ""
  )
  
  // Entities
  const [clienteId, setClienteId] = useState(pedidoEdit?.cliente_id || "")
  const [vendedorId, setVendedorId] = useState(pedidoEdit?.vendedor_id || "")
  
  // Totals & Footers
  const [formaPagamento, setFormaPagamento] = useState(pedidoEdit?.forma_pagamento || "")
  const [observacoes, setObservacoes] = useState(pedidoEdit?.observacoes || "")

  // Itens
  const [itens, setItens] = useState(() => {
    if (pedidoEdit?.itens_pedido && pedidoEdit.itens_pedido.length > 0) {
      return pedidoEdit.itens_pedido.map((ip: any) => ({
        id: ip.id || Date.now() + Math.random(),
        produto_id: ip.produto_id,
        produto_sku: ip.produtos?.sku || "",
        produto_nome: ip.produtos?.nome || "",
        quantidade: ip.quantidade,
        unidade_medida: ip.unidade_medida || "UN",
        preco_unitario: ip.preco_unitario,
        desconto_percentual: ip.desconto_percentual || 0
      }))
    }
    return [{ id: Date.now(), produto_id: "", produto_sku: "", produto_nome: "", quantidade: 1, unidade_medida: "UN", preco_unitario: 0, desconto_percentual: 0 }]
  })
  const [modalProdutoOpen, setModalProdutoOpen] = useState<{isOpen: boolean, index: number | null}>({isOpen: false, index: null})
  const [buscaModal, setBuscaModal] = useState("")

  const clienteSelecionado = dadosForm.clientes.find(c => c.id === clienteId)

  const handleProdutoChange = (index: number, produtoId: string) => {
    const produto = dadosForm.produtos.find(p => p.id === produtoId)
    if (produto) {
      const novosItens = [...itens]
      novosItens[index].produto_id = produtoId
      novosItens[index].produto_sku = produto.sku || ""
      novosItens[index].preco_unitario = produto.preco_venda || 0
      setItens(novosItens)
    }
  }

  const updateItem = (index: number, field: string, value: any) => {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [field]: value }
    setItens(novosItens)
  }

  const addItem = () => {
    setItens([...itens, { id: Date.now(), produto_id: "", produto_sku: "", produto_nome: "", quantidade: 1, unidade_medida: "UN", preco_unitario: 0, desconto_percentual: 0 }])
  }

  const removeItem = (index: number) => {
    if (itens.length > 1) {
      const novosItens = [...itens]
      novosItens.splice(index, 1)
      setItens(novosItens)
    }
  }

  // Cálculos
  const totalQtde = itens.reduce((acc: number, item: any) => acc + Number(item.quantidade), 0)
  const subtotalTotal = itens.reduce((acc: number, item: any) => {
    const preco = Number(item.preco_unitario) * Number(item.quantidade)
    const desc = preco * (Number(item.desconto_percentual) / 100)
    return acc + (preco - desc)
  }, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validações básicas
    if (!clienteId) return toast.error("Selecione um cliente")
    if (itens.some((i: any) => !i.produto_id)) return toast.error("Selecione os produtos para todos os itens")

    // Validação de Estoque Apenas para PEDIDOS
    if (tipo === 'PEDIDO') {
      for (const item of itens) {
        const prod = dadosForm.produtos.find(p => p.id === item.produto_id);
        if (prod) {
          const saldoAtual = prod.quantidade_estoque || 0;
          if (saldoAtual < Number(item.quantidade)) {
            return toast.error("Estoque Insuficiente", {
              description: `O produto "${prod.nome}" possui apenas ${saldoAtual} unid. Você tentou vender ${item.quantidade}.`
            });
          }
        }
      }
    }

    startTransition(async () => {
      const docData = {
        tipo,
        cliente_id: clienteId,
        vendedor_id: vendedorId,
        data_emissao: dataEmissao,
        data_entrega: dataEntrega,
        forma_pagamento: formaPagamento,
        observacoes,
        itens: itens.map((i: any) => ({
          produto_id: i.produto_id,
          quantidade: Number(i.quantidade),
          preco_unitario: Number(i.preco_unitario),
          desconto_percentual: Number(i.desconto_percentual),
          unidade_medida: i.unidade_medida
        }))
      }

      let res;
      if (isEdit && pedidoEdit) {
        res = await updateDocumento(pedidoEdit.id, docData)
      } else {
        res = await createDocumento(docData)
      }

      if (res.error) {
        toast.error("Erro ao salvar", { description: res.error })
      } else {
        router.push(tipo === 'ORCAMENTO' ? '/orcamentos' : '/pedidos')
        router.refresh()
      }
    })
  }

  const corTema = tipo === 'ORCAMENTO' ? 'text-blue-500' : 'text-emerald-500'
  const bgTema = tipo === 'ORCAMENTO' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
  const title = isEdit ? `Editar ${tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido'}` : `Novo ${tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido de Venda'}`
  const backLink = tipo === 'ORCAMENTO' ? '/orcamentos' : '/pedidos'

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link href={backLink} className="hover:text-foreground transition-colors flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </div>
          <div className={`flex items-center gap-2 ${corTema} mb-1`}>
            <FileText className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo de Vendas</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSubmit}
            disabled={isPending} 
            className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors text-white shadow-md h-10 px-6 ${bgTema} disabled:opacity-50`}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isPending ? "Salvando..." : `Salvar ${tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido'}`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal (Esquerda) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dados do Cliente */}
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <User className={`h-4 w-4 ${corTema}`} />
                Dados do Cliente
              </h3>
            </div>
            <div className="p-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Cliente *</label>
                <select 
                  value={clienteId} 
                  onChange={(e) => setClienteId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
                  required
                >
                  <option value="">Selecione um cliente...</option>
                  {dadosForm.clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.cpf_cnpj || 'Sem doc'})</option>
                  ))}
                </select>
              </div>
              
              {clienteSelecionado && (
                <div className="sm:col-span-2 bg-muted/20 p-3 rounded-lg text-sm grid grid-cols-2 gap-2 text-muted-foreground">
                  <div><strong className="text-foreground">Doc:</strong> {clienteSelecionado.cpf_cnpj || '-'}</div>
                  <div><strong className="text-foreground">Contato:</strong> {clienteSelecionado.celular || '-'}</div>
                  <div><strong className="text-foreground">Email:</strong> {clienteSelecionado.email || '-'}</div>
                  <div className="col-span-2"><strong className="text-foreground">Endereço:</strong> {clienteSelecionado.rua}, {clienteSelecionado.numero} - {clienteSelecionado.cidade}/{clienteSelecionado.estado}</div>
                </div>
              )}
            </div>
          </div>

          {/* Produtos / Itens */}
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <ShoppingCart className={`h-4 w-4 ${corTema}`} />
                Produtos
              </h3>
            </div>
            
            <div className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[1000px]">
                <thead className="bg-muted/30 border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 min-w-[60px] w-10">Item</th>
                    <th className="px-4 py-3 min-w-[160px] w-40">Produto</th>
                    <th className="px-4 py-3 min-w-[250px]">Descrição</th>
                    <th className="px-4 py-3 min-w-[80px] w-20">U.M</th>
                    <th className="px-4 py-3 min-w-[100px] w-24">Qtde</th>
                    <th className="px-4 py-3 min-w-[120px] w-32">V. Unit (R$)</th>
                    <th className="px-4 py-3 min-w-[100px] w-24">Desc %</th>
                    <th className="px-4 py-3 min-w-[120px] w-32">Subtotal</th>
                    <th className="px-4 py-3 min-w-[50px] w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {itens.map((item: any, index: number) => {
                    const sub = (Number(item.quantidade) * Number(item.preco_unitario)) * (1 - (Number(item.desconto_percentual)/100))
                    
                    return (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-4 py-2 text-center font-medium">{index + 1}</td>
                        <td className="px-4 py-2">
                          <div className="relative w-full">
                            <input 
                              type="text"
                              value={item.produto_sku || ''}
                              onChange={(e) => updateItem(index, 'produto_sku', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.currentTarget.value;
                                  if (!val) return;
                                  const p = dadosForm.produtos.find(prod => prod.sku?.toLowerCase() === val.toLowerCase());
                                  if (p) {
                                    handleProdutoChange(index, p.id);
                                    updateItem(index, 'produto_nome', p.nome);
                                    if (tipo === 'PEDIDO' && (p.quantidade_estoque || 0) <= 0) {
                                      toast.warning(`Atenção: O produto ${p.nome} está sem estoque!`);
                                    }
                                  } else {
                                    updateItem(index, 'produto_id', '');
                                    updateItem(index, 'produto_nome', '');
                                    updateItem(index, 'preco_unitario', 0);
                                    alert("Produto não encontrado pelo código.");
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const p = dadosForm.produtos.find(prod => prod.sku?.toLowerCase() === val.toLowerCase());
                                if (p) {
                                  handleProdutoChange(index, p.id);
                                  updateItem(index, 'produto_nome', p.nome);
                                  if (tipo === 'PEDIDO' && (p.quantidade_estoque || 0) <= 0) {
                                    toast.warning(`Atenção: O produto ${p.nome} está sem estoque!`);
                                  }
                                } else {
                                  updateItem(index, 'produto_id', '');
                                  updateItem(index, 'produto_nome', '');
                                  updateItem(index, 'preco_unitario', 0);
                                }
                              }}
                              placeholder="Cód..."
                              className="w-full h-8 rounded border border-border/50 bg-background pl-2 pr-8 text-sm focus:ring-1 focus:ring-primary/50 uppercase"
                            />
                            <button 
                              type="button"
                              onClick={() => setModalProdutoOpen({isOpen: true, index})}
                              className="absolute right-1 top-1 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                              title="Consultar Produto"
                            >
                              <Search className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="w-full min-h-8 px-2 py-1.5 text-sm text-foreground truncate select-none">
                            {item.produto_nome || <span className="text-muted-foreground/50 italic">Selecione...</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <input type="text" value={item.unidade_medida} onChange={(e) => updateItem(index, 'unidade_medida', e.target.value)} className="w-full h-8 rounded border border-border/50 bg-background px-2 text-center" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" min="1" value={item.quantidade} onChange={(e) => updateItem(index, 'quantidade', e.target.value)} className="w-full h-8 rounded border border-border/50 bg-background px-2 text-center" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.01" value={item.preco_unitario} onChange={(e) => updateItem(index, 'preco_unitario', e.target.value)} className="w-full h-8 rounded border border-border/50 bg-background px-2 text-right" />
                        </td>
                        <td className="px-4 py-2">
                          <input type="number" step="0.1" min="0" max="100" value={item.desconto_percentual} onChange={(e) => updateItem(index, 'desconto_percentual', e.target.value)} className="w-full h-8 rounded border border-border/50 bg-background px-2 text-center" />
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-foreground">
                          {sub.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => removeItem(index)} className="text-muted-foreground hover:text-red-500 transition-colors p-1" title="Remover item">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border/50 bg-muted/10">
              <button onClick={addItem} type="button" className="text-sm font-medium flex items-center gap-1 text-primary hover:text-primary/80 transition-colors">
                <Plus className="h-4 w-4" /> Adicionar Produto
              </button>
            </div>
          </div>
          
          {/* Informações Adicionais */}
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <Tag className={`h-4 w-4 ${corTema}`} />
                Informações Adicionais
              </h3>
            </div>
            <div className="p-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Forma de Pagamento</label>
                <input value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} placeholder="Ex: 30 dias no boleto, PIX, Cartão..." className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium">Observações</label>
                <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} placeholder="Condições gerais, validade da proposta, local de entrega..." className="flex w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm resize-none" />
              </div>
            </div>
          </div>

        </div>

        {/* Coluna Lateral (Direita) */}
        <div className="space-y-6">
          
          {/* Resumo / Totais */}
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden sticky top-6">
            <div className="p-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold">
                <Calculator className={`h-4 w-4 ${corTema}`} />
                Resumo
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Data de Emissão</label>
                <input type="date" value={dataEmissao} onChange={(e) => setDataEmissao(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Data de Entrega / Validade</label>
                <input type="date" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm" />
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-muted-foreground">Vendedor Responsável</label>
                <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm">
                  <option value="">Selecione...</option>
                  {dadosForm.vendedores.map(v => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 mt-4 border-t border-border/50 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Qtd. de Itens</span>
                  <span className="font-medium">{itens.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Qtd. Total</span>
                  <span className="font-medium">{totalQtde}</span>
                </div>
                <div className="flex justify-between items-end pt-3 mt-3 border-t border-border/50">
                  <span className="text-base font-semibold">Total R$</span>
                  <span className={`text-2xl font-bold ${corTema}`}>
                    {subtotalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 border-t border-border/50">
              <button 
                onClick={handleSubmit}
                disabled={isPending} 
                className={`w-full flex items-center justify-center rounded-md text-sm font-medium transition-colors text-white shadow-md h-12 ${bgTema} disabled:opacity-50`}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isPending ? "Processando..." : `Finalizar ${tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido'}`}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Modal Consulta Produto (Estilo Protheus) */}
      {modalProdutoOpen.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl border border-border flex flex-col h-[600px] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Consulta Padrão - Produto
              </h2>
              <button onClick={() => setModalProdutoOpen({isOpen: false, index: null})} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="p-4 border-b border-border bg-muted/10">
              <input 
                type="text" 
                placeholder="Buscar por código ou descrição..." 
                value={buscaModal}
                onChange={(e) => setBuscaModal(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-auto p-0 bg-background">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 sticky top-0 shadow-sm">
                  <tr>
                    <th className="px-4 py-2 w-48 font-medium">Código</th>
                    <th className="px-4 py-2 font-medium">Descrição</th>
                    <th className="px-4 py-2 w-24 text-center font-medium">Estoque</th>
                    <th className="px-4 py-2 w-32 text-right font-medium">Preço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {dadosForm.produtos
                    .filter(p => !buscaModal || (p.sku?.toLowerCase() || '').includes(buscaModal.toLowerCase()) || p.nome.toLowerCase().includes(buscaModal.toLowerCase()))
                    .map(p => (
                      <tr 
                        key={p.id} 
                        className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors group"
                        onClick={() => {
                          if (modalProdutoOpen.index !== null) {
                            handleProdutoChange(modalProdutoOpen.index, p.id)
                            updateItem(modalProdutoOpen.index, 'produto_nome', p.nome)

                            if (tipo === 'PEDIDO' && (p.quantidade_estoque || 0) <= 0) {
                              toast.warning(`Atenção: O produto ${p.nome} está sem estoque!`);
                            }
                          }
                          setModalProdutoOpen({isOpen: false, index: null})
                          setBuscaModal("")
                        }}
                      >
                        <td className="px-4 py-2 font-medium">{p.sku || '-'}</td>
                        <td className="px-4 py-2 group-hover:font-medium">{p.nome}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            (p.quantidade_estoque || 0) <= 0 
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {p.quantidade_estoque || 0}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          {(p.preco_venda || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                    {dadosForm.produtos.filter(p => !buscaModal || (p.sku?.toLowerCase() || '').includes(buscaModal.toLowerCase()) || p.nome.toLowerCase().includes(buscaModal.toLowerCase())).length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                          Nenhum produto encontrado na consulta.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border flex justify-end bg-muted/30">
              <button 
                onClick={() => setModalProdutoOpen({isOpen: false, index: null})}
                className="px-6 py-2 bg-background border border-border text-foreground rounded-md hover:bg-muted font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
