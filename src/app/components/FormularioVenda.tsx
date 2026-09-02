"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createDocumento, updateDocumento, searchClientesAPI, searchProdutosAPI } from "@/app/actions/vendas"
import { ArrowLeft, Save, Plus, Trash2, Calendar, FileText, User, ShoppingCart, Calculator, Tag, Loader2, Search, Truck, Edit } from "lucide-react"
import { simularMelhorEnvio } from "@/app/actions/frete"
import Link from "next/link"
import { toast } from "sonner"
import { EditarItemModal } from "./EditarItemModal"
import { AdicionarItemModal } from "./AdicionarItemModal"

interface Props {
  tipo: 'ORCAMENTO' | 'PEDIDO'
  dadosForm: {
    clientes: any[]
    vendedores: any[]
    produtos: any[]
    tenant_cep?: string
  }
  isEdit?: boolean
  pedidoEdit?: any
}

export function FormularioVenda({ tipo, dadosForm, isEdit, pedidoEdit }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [listaClientes, setListaClientes] = useState(dadosForm.clientes)
  const [listaProdutos, setListaProdutos] = useState(dadosForm.produtos)

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
  const [valorFrete, setValorFrete] = useState<number>(Number(pedidoEdit?.valor_frete) || 0)
  const [tipoFrete, setTipoFrete] = useState(pedidoEdit?.tipo_frete || "CIF")
  
  // Frete UI
  const [modalFreteOpen, setModalFreteOpen] = useState(false)
  const [loadingFrete, setLoadingFrete] = useState(false)
  const [freteOpcoes, setFreteOpcoes] = useState<any[]>([])
  
  // Dimensões do Pacote
  const [dimC, setDimC] = useState<number>(20) // Comprimento
  const [dimL, setDimL] = useState<number>(20) // Largura
  const [dimA, setDimA] = useState<number>(20) // Altura

  // Peso total: calculado automaticamente a partir dos itens, mas pode ser
  // sobrescrito manualmente (ex: quando algum produto nao tem peso cadastrado).
  // Ao editar um documento cujo peso salvo diverge do que os itens dariam
  // hoje, comeca em modo manual com esse valor (senao a edicao perderia o
  // override feito antes). Se bater com o calculo, comeca em modo automatico.
  const [pesoTotalManual, setPesoTotalManual] = useState<number | null>(() => {
    if (pedidoEdit?.peso_total == null) return null
    const pesoSalvo = Number(pedidoEdit.peso_total)
    const pesoCalculadoOriginal = (pedidoEdit.itens_pedido || []).reduce((acc: number, ip: any) => {
      return acc + ((Number(ip.produtos?.peso) || 0) * (Number(ip.quantidade) || 0))
    }, 0)
    return Math.abs(pesoSalvo - pesoCalculadoOriginal) > 0.0005 ? pesoSalvo : null
  })

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
    return []
  })
  
  const [isAdicionarModalOpen, setIsAdicionarModalOpen] = useState(false)
  const [modalUmOpen, setModalUmOpen] = useState<{isOpen: boolean, index: number | null}>({isOpen: false, index: null})
  const [modalEditItemOpen, setModalEditItemOpen] = useState<{isOpen: boolean, index: number | null}>({isOpen: false, index: null})

  const [modalClienteOpen, setModalClienteOpen] = useState(false)
  const [buscaModalCliente, setBuscaModalCliente] = useState("")
  const [inputClienteCodigo, setInputClienteCodigo] = useState(() => {
    const c = listaClientes.find(cli => cli.id === pedidoEdit?.cliente_id)
    return c?.codigo || ""
  })

  const clienteSelecionado = listaClientes.find(c => c.id === clienteId)

  const handleProdutoChange = (index: number, produtoId: string) => {
    const produto = listaProdutos.find(p => p.id === produtoId)
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
    let finalValue = value
    if (['quantidade', 'preco_unitario', 'desconto_percentual'].includes(field)) {
      const num = Number(value)
      if (num < 0) finalValue = 0 // Reseta para zero se for negativo
    }
    novosItens[index] = { ...novosItens[index], [field]: finalValue }
    setItens(novosItens)
  }

  const addItem = () => {
    setItens([...itens, { id: Date.now(), produto_id: "", produto_sku: "", produto_nome: "", quantidade: 1, unidade_medida: "UN", preco_unitario: 0, desconto_percentual: 0 }])
  }

  const removeItem = (index: number) => {
    const novosItens = [...itens]
    novosItens.splice(index, 1)
    setItens(novosItens)
  }

  // Cálculos
  const totalQtde = itens.reduce((acc: number, item: any) => acc + Number(item.quantidade), 0)
  const subtotalTotal = itens.reduce((acc: number, item: any) => {
    const preco = Number(item.preco_unitario) * Number(item.quantidade)
    const desc = preco * (Number(item.desconto_percentual) / 100)
    return acc + (preco - desc)
  }, 0)

  const descontoTotal = itens.reduce((acc: number, item: any) => {
    const precoBruto = Number(item.preco_unitario) * Number(item.quantidade)
    const precoLiquido = precoBruto * (1 - (Number(item.desconto_percentual)/100))
    return acc + (precoBruto - precoLiquido)
  }, 0)

  const pesoTotalCalculado = itens.reduce((acc: number, item: any) => {
    const p = listaProdutos.find(prod => prod.id === item.produto_id)
    return acc + ((Number(p?.peso) || 0) * (Number(item.quantidade) || 0))
  }, 0)
  const totalPeso = pesoTotalManual ?? pesoTotalCalculado

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validações básicas
    if (!clienteId) return toast.error("Selecione um cliente")
    if (itens.length === 0) return toast.error("Adicione pelo menos um produto")
    if (itens.some((i: any) => !i.produto_id)) return toast.error("Selecione os produtos para todos os itens")

    // Validação de Estoque Apenas para PEDIDOS
    if (tipo === 'PEDIDO') {
      for (const item of itens) {
        const prod = listaProdutos.find(p => p.id === item.produto_id);
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
        valor_frete: Number(valorFrete),
        tipo_frete: tipoFrete,
        desconto_total: descontoTotal,
        peso_total: totalPeso,
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
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen max-w-[1600px] w-full mx-auto">
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

      <div className="space-y-6">
          
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
                <div className="flex gap-2">
                  <div className="relative w-32">
                    <input 
                      type="text"
                      placeholder="Cód..."
                      value={inputClienteCodigo}
                      onChange={(e) => setInputClienteCodigo(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const val = e.currentTarget.value
                          if (!val) {
                            setClienteId("")
                            return
                          }
                          let c = listaClientes.find(cli => cli.codigo?.toLowerCase() === val.toLowerCase())
                          if (!c) {
                            const res = await searchClientesAPI(val)
                            if (res.length > 0) {
                              setListaClientes(prev => {
                                const newCli = res.filter(r => !prev.some(p => p.id === r.id))
                                return [...prev, ...newCli]
                              })
                              c = res.find(cli => cli.codigo?.toLowerCase() === val.toLowerCase()) || res[0]
                            }
                          }
                          if (c) {
                            setClienteId(c.id)
                            setInputClienteCodigo(c.codigo || "")
                          } else {
                            toast.error("Cliente não encontrado.")
                            setClienteId("")
                          }
                        }
                      }}
                      onBlur={async (e) => {
                        const val = e.target.value
                        if (!val) {
                          setClienteId("")
                          return
                        }
                        let c = listaClientes.find(cli => cli.codigo?.toLowerCase() === val.toLowerCase())
                        if (!c) {
                          const res = await searchClientesAPI(val)
                          if (res.length > 0) {
                            setListaClientes(prev => {
                              const newCli = res.filter(r => !prev.some(p => p.id === r.id))
                              return [...prev, ...newCli]
                            })
                            c = res.find(cli => cli.codigo?.toLowerCase() === val.toLowerCase()) || res[0]
                          }
                        }
                        if (c) {
                          setClienteId(c.id)
                          setInputClienteCodigo(c.codigo || "")
                        }
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 uppercase"
                    />
                    <button 
                      type="button"
                      onClick={() => setModalClienteOpen(true)}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-primary transition-colors"
                      title="Consultar Cliente"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground overflow-hidden whitespace-nowrap text-ellipsis">
                    {clienteSelecionado ? `${clienteSelecionado.nome} (${clienteSelecionado.cpf_cnpj || 'Sem doc'})` : <span className="text-muted-foreground/50">Selecione um cliente...</span>}
                  </div>
                </div>
              </div>
              
              {clienteSelecionado && (
                <div className="sm:col-span-2 bg-muted/20 p-3 rounded-lg text-sm grid grid-cols-2 gap-2 text-muted-foreground">
                  <div><strong className="text-foreground">Doc:</strong> {clienteSelecionado.cpf_cnpj || '-'}</div>
                  <div><strong className="text-foreground">Contato:</strong> {clienteSelecionado.celular || '-'}</div>
                  <div><strong className="text-foreground">Email:</strong> {clienteSelecionado.email || '-'}</div>
                  <div><strong className="text-foreground">CEP:</strong> {clienteSelecionado.cep || '-'}</div>
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
            
            <div className="p-0 overflow-x-auto overflow-y-auto max-h-[60vh] relative">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/30 border-b uppercase text-muted-foreground sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-2 py-2 w-8 text-center">Item</th>
                    <th className="px-2 py-2 w-28">Código</th>
                    <th className="px-2 py-2 min-w-[150px]">Descrição</th>
                    <th className="px-2 py-2 w-20 text-center">NCM</th>
                    <th className="px-2 py-2 w-20 text-center">Peso</th>
                    <th className="px-2 py-2 w-16 text-center">U.M</th>
                    <th className="px-2 py-2 w-16 text-center">Qtd</th>
                    <th className="px-2 py-2 w-24 text-right">R$ Un.</th>
                    <th className="px-2 py-2 w-16 text-center">Desc %</th>
                    <th className="px-2 py-2 w-28 text-right">Subtotal</th>
                    <th className="px-2 py-2 w-16 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {itens.map((item: any, index: number) => {
                    const sub = (Number(item.quantidade) * Number(item.preco_unitario)) * (1 - (Number(item.desconto_percentual)/100))
                    const pData = listaProdutos.find(p => p.id === item.produto_id)
                    
                    return (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="px-2 py-1 text-center font-medium">{index + 1}</td>
                        <td className="px-2 py-1">
                          <div className="w-full px-1 py-1 text-foreground truncate">
                            {item.produto_sku || <span className="text-muted-foreground/50">-</span>}
                          </div>
                        </td>
                        <td className="px-2 py-1">
                          <div className="w-full px-1 py-1 text-foreground truncate select-none font-medium">
                            {item.produto_nome || <span className="text-muted-foreground/50 italic">Selecione...</span>}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-center text-muted-foreground">
                          {pData?.ncm || '-'}
                        </td>
                        <td className="px-2 py-1 text-center text-muted-foreground">
                          {pData?.peso ? `${pData.peso} kg` : '-'}
                        </td>
                        <td className="px-2 py-1">
                          <div className="relative w-full">
                            <input 
                              type="text" 
                              value={item.unidade_medida} 
                              onChange={(e) => updateItem(index, 'unidade_medida', e.target.value.toUpperCase())} 
                              className="w-full h-7 rounded border border-border/50 bg-background pl-1 pr-5 text-center uppercase text-xs" 
                            />
                            <button 
                              type="button"
                              onClick={() => setModalUmOpen({isOpen: true, index})}
                              className="absolute right-0.5 top-1 h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
                              title="Consultar U.M"
                            >
                              <Search className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-2 py-1">
                          <div 
                            className="w-full px-1 text-center font-medium text-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                            onClick={() => setModalEditItemOpen({isOpen: true, index})}
                            title="Clique para editar"
                          >
                            {item.quantidade}
                          </div>
                        </td>
                        <td className="px-2 py-1">
                          <div 
                            className="w-full px-1 text-right text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                            onClick={() => setModalEditItemOpen({isOpen: true, index})}
                            title="Clique para editar"
                          >
                            {Number(item.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-2 py-1">
                          <div 
                            className="w-full px-1 text-center text-muted-foreground cursor-pointer hover:text-indigo-500 transition-colors"
                            onClick={() => setModalEditItemOpen({isOpen: true, index})}
                            title="Clique para editar"
                          >
                            {item.desconto_percentual > 0 ? `${item.desconto_percentual}%` : '-'}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right font-medium text-foreground">
                          {sub.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="px-2 py-1">
                          <div className="flex items-center justify-center gap-1">
                            <button 
                              type="button"
                              onClick={() => setModalEditItemOpen({isOpen: true, index})} 
                              className="p-1 text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              type="button"
                              onClick={() => removeItem(index)} 
                              className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" 
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border/50 bg-muted/10">
              <button onClick={() => setIsAdicionarModalOpen(true)} type="button" className="text-sm font-medium flex items-center gap-1 text-primary hover:text-primary/80 transition-colors">
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
          
          {/* Resumo / Totais */}
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden flex flex-col h-full">
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
                <div className="flex justify-between items-center text-sm gap-2">
                  <span className="text-muted-foreground shrink-0">Peso Total (kg)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={totalPeso}
                      onChange={(e) => setPesoTotalManual(Math.max(0, Number(e.target.value) || 0))}
                      className="w-28 h-8 rounded-md border border-input bg-background/50 px-2 text-right text-sm font-medium"
                      title="Calculado automaticamente pelos itens - pode ser alterado manualmente"
                    />
                    {pesoTotalManual !== null && (
                      <button
                        type="button"
                        onClick={() => setPesoTotalManual(null)}
                        className="text-xs text-muted-foreground hover:text-primary underline shrink-0"
                        title="Voltar a calcular automaticamente pelos itens"
                      >
                        auto
                      </button>
                    )}
                  </div>
                </div>
                {/* Dimensões */}
                <div className="py-2 border-t border-border/50 space-y-2">
                  <span className="text-sm text-muted-foreground block">Dimensões da Caixa (C x L x A) cm</span>
                  <div className="flex items-center gap-1">
                    <input type="number" min="0" value={dimC} onChange={e => setDimC(Math.max(0, Number(e.target.value) || 0))} className="min-w-0 flex-1 h-8 rounded-md border border-input bg-background/50 text-center text-sm" title="Comprimento" />
                    <span className="text-muted-foreground text-xs">x</span>
                    <input type="number" min="0" value={dimL} onChange={e => setDimL(Math.max(0, Number(e.target.value) || 0))} className="min-w-0 flex-1 h-8 rounded-md border border-input bg-background/50 text-center text-sm" title="Largura" />
                    <span className="text-muted-foreground text-xs">x</span>
                    <input type="number" min="0" value={dimA} onChange={e => setDimA(Math.max(0, Number(e.target.value) || 0))} className="min-w-0 flex-1 h-8 rounded-md border border-input bg-background/50 text-center text-sm" title="Altura" />
                  </div>
                </div>

                {/* Frete */}
                <div className="py-2 border-t border-border/50 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-4 w-4" />
                      Frete
                    </span>
                    <select 
                      value={tipoFrete}
                      onChange={(e) => setTipoFrete(e.target.value)}
                      className="h-8 rounded-md border border-input bg-background/50 px-2 text-xs w-36"
                    >
                      <option value="CIF">CIF (Emitente)</option>
                      <option value="FOB">FOB (Destinatário)</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between gap-2">
                    <button 
                      type="button"
                      onClick={async () => {
                        if (!clienteSelecionado?.cep) {
                          return toast.error("O cliente selecionado não possui CEP cadastrado!")
                        }
                        setLoadingFrete(true)
                        const cepOrigem = dadosForm.tenant_cep || "13400820"
                        const res = await simularMelhorEnvio(cepOrigem, clienteSelecionado.cep, totalPeso, subtotalTotal, dimC, dimL, dimA)
                        setLoadingFrete(false)
                        if (res.error) {
                          toast.error(res.error)
                        } else {
                          setFreteOpcoes(res.data || [])
                          setModalFreteOpen(true)
                        }
                      }}
                      disabled={loadingFrete || !clienteId || totalPeso <= 0}
                      className="flex-1 h-8 text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium transition-colors px-2 rounded disabled:opacity-50 border border-primary/20"
                    >
                      {loadingFrete ? "Calculando..." : "Calcular Melhor Envio"}
                    </button>
                    <input 
                      type="number"
                      min="0"
                      step="0.01"
                      value={valorFrete || ""}
                      onChange={(e) => setValorFrete(Number(e.target.value) || 0)}
                      className="min-w-0 w-24 h-8 rounded-md border border-input bg-background/50 px-2 text-right text-sm font-medium"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-end pt-3 mt-3 border-t border-border/50">
                  <span className="text-base font-semibold">Total R$</span>
                  <span className={`text-2xl font-bold ${corTema}`}>
                    {(subtotalTotal + (tipoFrete === 'FOB' ? (valorFrete || 0) : 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
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

      {/* Modal Consulta Cliente */}
      {modalClienteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl border border-border flex flex-col h-[600px] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Consulta Padrão - Cliente
              </h2>
              <button onClick={() => setModalClienteOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="p-4 border-b border-border bg-muted/10">
              <input 
                type="text" 
                placeholder="Buscar por código, nome ou CNPJ..." 
                value={buscaModalCliente}
                onChange={async (e) => {
                  const val = e.target.value
                  setBuscaModalCliente(val)
                  if (val.length >= 3) {
                    const res = await searchClientesAPI(val)
                    setListaClientes(prev => {
                      const newCli = res.filter(r => !prev.some(p => p.id === r.id))
                      return [...prev, ...newCli]
                    })
                  }
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-auto p-0 bg-background">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 sticky top-0 shadow-sm">
                  <tr>
                    <th className="px-4 py-2 w-32 font-medium">Código</th>
                    <th className="px-4 py-2 font-medium">Nome / Razão Social</th>
                    <th className="px-4 py-2 w-48 font-medium">CPF/CNPJ</th>
                    <th className="px-4 py-2 w-32 font-medium">Cidade/UF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {listaClientes
                    .filter(c => !buscaModalCliente || 
                                (c.codigo?.toLowerCase() || '').includes(buscaModalCliente.toLowerCase()) || 
                                c.nome.toLowerCase().includes(buscaModalCliente.toLowerCase()) || 
                                (c.cpf_cnpj || '').includes(buscaModalCliente)
                    )
                    .map(c => (
                      <tr 
                        key={c.id} 
                        className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors group"
                        onClick={() => {
                          setClienteId(c.id)
                          setInputClienteCodigo(c.codigo || "")
                          setModalClienteOpen(false)
                          setBuscaModalCliente("")
                        }}
                      >
                        <td className="px-4 py-2 font-medium">{c.codigo || '-'}</td>
                        <td className="px-4 py-2 group-hover:font-medium">{c.nome}</td>
                        <td className="px-4 py-2">{c.cpf_cnpj || '-'}</td>
                        <td className="px-4 py-2">{c.cidade ? `${c.cidade}/${c.estado}` : '-'}</td>
                      </tr>
                    ))}
                    {listaClientes.filter(c => !buscaModalCliente || (c.codigo?.toLowerCase() || '').includes(buscaModalCliente.toLowerCase()) || c.nome.toLowerCase().includes(buscaModalCliente.toLowerCase()) || (c.cpf_cnpj || '').includes(buscaModalCliente)).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                          Nenhum cliente encontrado na consulta.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border flex justify-end bg-muted/30">
              <button 
                onClick={() => setModalClienteOpen(false)}
                className="px-6 py-2 bg-background border border-border text-foreground rounded-md hover:bg-muted font-medium transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <AdicionarItemModal
        isOpen={isAdicionarModalOpen}
        tipo={tipo}
        listaProdutosInit={listaProdutos}
        onClose={() => setIsAdicionarModalOpen(false)}
        onAdicionar={(novoItem) => {
          setItens([...itens, novoItem])

          // Se o produto não estiver na lista local, adiciona
          if (!listaProdutos.some(p => p.id === novoItem.produto_id)) {
             searchProdutosAPI(novoItem.produto_sku || novoItem.produto_nome).then(res => {
               if (res.length > 0) {
                 setListaProdutos(prev => {
                    const newP = res.filter(r => !prev.some(x => x.id === r.id))
                    return [...prev, ...newP]
                 })
               }
             })
          }
        }}
      />

      {/* Modal U.M */}
      {modalUmOpen.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-lg shadow-2xl w-full max-w-sm border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Selecione a U.M
              </h2>
              <button onClick={() => setModalUmOpen({isOpen: false, index: null})} className="text-muted-foreground hover:text-foreground">
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
                    if (modalUmOpen.index !== null) {
                      updateItem(modalUmOpen.index, 'unidade_medida', um.sigla)
                    }
                    setModalUmOpen({isOpen: false, index: null})
                  }}
                  className="flex flex-col items-center justify-center p-3 border border-border/50 rounded-lg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group"
                >
                  <span className="font-bold text-lg">{um.sigla}</span>
                  <span className="text-xs text-muted-foreground group-hover:text-primary-foreground/70">{um.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Frete */}
      {modalFreteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg border border-border/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-primary/10 border-b border-border/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Cotação de Frete
                <span className="text-xs font-normal text-muted-foreground ml-2 bg-muted px-2 py-0.5 rounded-full">
                  Motor Melhor Envio
                </span>
              </h2>
              <button onClick={() => setModalFreteOpen(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="p-4 grid gap-3 max-h-[60vh] overflow-y-auto bg-muted/10">
              {freteOpcoes.map((opcao: any) => (
                <div 
                  key={opcao.id}
                  onClick={() => {
                    setValorFrete(opcao.price)
                    setModalFreteOpen(false)
                    toast.success(`Frete ${opcao.name} selecionado!`)
                  }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white rounded flex items-center justify-center p-1 shadow-sm border border-border/20">
                      <img src={opcao.logo} alt={opcao.company} className="max-h-full max-w-full object-contain" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{opcao.name}</p>
                      <p className="text-xs text-muted-foreground">Prazo: até {opcao.delivery_time} dias úteis</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">
                      {opcao.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modais Exibidos Fora do Fluxo da Página */}
      <EditarItemModal 
        isOpen={modalEditItemOpen.isOpen}
        item={modalEditItemOpen.index !== null ? itens[modalEditItemOpen.index] : null}
        onClose={() => setModalEditItemOpen({ isOpen: false, index: null })}
        onSalvar={(itemAtualizado) => {
          if (modalEditItemOpen.index !== null) {
            const novosItens = [...itens]
            novosItens[modalEditItemOpen.index] = itemAtualizado
            setItens(novosItens)
          }
          setModalEditItemOpen({ isOpen: false, index: null })
        }}
      />
    </div>
  )
}
