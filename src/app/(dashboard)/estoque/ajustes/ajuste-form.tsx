'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search, Save, Loader2, PackageSearch } from 'lucide-react'
import { searchProdutosAPI } from '@/app/actions/vendas'
import { criarAjusteEstoque, getSaldoAtualProduto } from '@/app/actions/estoque'

interface Produto {
  id: string
  nome: string
  sku: string | null
  quantidade_estoque?: number
}

const MOTIVOS = [
  { value: 'entrada_manual', label: 'Entrada Manual' },
  { value: 'devolucao', label: 'Devolução' },
  { value: 'perda', label: 'Perda / Dano' },
  { value: 'contagem', label: 'Contagem Física' },
]

export function AjusteForm({ produtosIniciais }: { produtosIniciais: Produto[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [listaProdutos, setListaProdutos] = useState<Produto[]>(produtosIniciais)
  const [inputCodigo, setInputCodigo] = useState('')
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  const [carregandoSelecao, setCarregandoSelecao] = useState(false)

  const [modalProdutoOpen, setModalProdutoOpen] = useState(false)
  const [buscaModal, setBuscaModal] = useState('')

  const [novoSaldo, setNovoSaldo] = useState<number | string>('')
  const [motivo, setMotivo] = useState('entrada_manual')
  const [observacoes, setObservacoes] = useState('')

  // Resincroniza a lista local sempre que a pagina revalida (ex: apos um
  // ajuste, router.refresh() traz saldos atualizados do servidor).
  useEffect(() => {
    setListaProdutos(produtosIniciais)
  }, [produtosIniciais])

  const handleSelecionar = async (p: Produto) => {
    setInputCodigo('')
    setModalProdutoOpen(false)
    setBuscaModal('')
    setMotivo('entrada_manual')
    setObservacoes('')
    setCarregandoSelecao(true)

    // Busca o saldo real no servidor: a copia local pode estar desatualizada
    // se este produto foi ajustado ha pouco.
    const atual = await getSaldoAtualProduto(p.id)
    const produtoAtualizado = atual ? { ...p, ...atual } : p

    setProdutoSelecionado(produtoAtualizado)
    setNovoSaldo(produtoAtualizado.quantidade_estoque ?? 0)
    setCarregandoSelecao(false)
  }

  const buscarPorCodigo = async (val: string) => {
    if (!val) return
    let p = listaProdutos.find((prod) => prod.sku?.toLowerCase() === val.toLowerCase())
    if (!p) {
      const res = await searchProdutosAPI(val)
      if (res.length > 0) {
        setListaProdutos((prev) => {
          const novos = res.filter((r: Produto) => !prev.some((x) => x.id === r.id))
          return [...prev, ...novos]
        })
        p = res.find((r: Produto) => r.sku?.toLowerCase() === val.toLowerCase()) || res[0]
      }
    }
    if (p) {
      handleSelecionar(p)
    } else {
      toast.error('Produto não encontrado.')
    }
  }

  const handleConfirmar = () => {
    if (!produtoSelecionado) return
    const formData = new FormData()
    formData.set('produto_id', produtoSelecionado.id)
    formData.set('quantidade_nova', String(novoSaldo))
    formData.set('motivo', motivo)
    formData.set('observacoes', observacoes)

    startTransition(async () => {
      const res = await criarAjusteEstoque(formData)
      if (res.error) {
        toast.error('Erro ao ajustar estoque', { description: res.error })
      } else {
        toast.success(`Saldo de "${res.produtoNome}" atualizado!`)
        setProdutoSelecionado(null)
        setNovoSaldo('')
        setObservacoes('')
        router.refresh()
      }
    })
  }

  return (
    <>
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-muted/20">
        <h3 className="flex items-center gap-2 font-semibold">
          <PackageSearch className="h-4 w-4 text-indigo-500" />
          Novo Ajuste
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {!produtoSelecionado ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Produto</label>
            <div className="flex gap-2">
              <div className="relative w-40">
                <input
                  type="text"
                  placeholder="Cód..."
                  value={inputCodigo}
                  disabled={carregandoSelecao}
                  onChange={(e) => setInputCodigo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      buscarPorCodigo(e.currentTarget.value)
                    }
                  }}
                  onBlur={(e) => buscarPorCodigo(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 pr-9 text-sm focus:ring-2 focus:ring-primary/50 uppercase disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setModalProdutoOpen(true)}
                  disabled={carregandoSelecao}
                  className="absolute right-2 top-2.5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  title="Consultar Produto"
                >
                  {carregandoSelecao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex-1 h-10 flex items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground/50">
                {carregandoSelecao ? 'Carregando saldo atual...' : 'Digite o código ou clique na lupa para consultar...'}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted/20 rounded-lg p-3">
              <div>
                <p className="font-medium">{produtoSelecionado.nome}</p>
                <p className="text-xs text-muted-foreground">Código: {produtoSelecionado.sku || '-'}</p>
              </div>
              <button
                type="button"
                onClick={() => setProdutoSelecionado(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Trocar produto
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground block">Saldo Atual</label>
                <div className="h-10 px-3 flex items-center rounded-md border border-input bg-muted/30 text-sm font-medium">
                  {produtoSelecionado.quantidade_estoque ?? 0}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-indigo-600 block">Novo Saldo *</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={novoSaldo}
                  onChange={(e) => setNovoSaldo(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  className="w-full h-10 px-3 rounded-md border-2 border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-bold text-indigo-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground block">Motivo *</label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background/50 px-3 text-sm"
                >
                  {MOTIVOS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground block">Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
                placeholder="Detalhe o motivo do ajuste (opcional)..."
                className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirmar}
              disabled={isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center h-10 px-6 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-md transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {isPending ? 'Salvando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        )}
      </div>
    </div>

    {modalProdutoOpen && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl border border-border flex flex-col h-[600px] max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Consulta Padrão - Produto
            </h2>
            <button onClick={() => setModalProdutoOpen(false)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
          <div className="p-4 border-b border-border bg-muted/10">
            <input
              type="text"
              placeholder="Buscar por código ou descrição..."
              value={buscaModal}
              onChange={async (e) => {
                const val = e.target.value
                setBuscaModal(val)
                if (val.length >= 3) {
                  const res = await searchProdutosAPI(val)
                  setListaProdutos((prev) => {
                    const novos = res.filter((r: Produto) => !prev.some((x) => x.id === r.id))
                    return [...prev, ...novos]
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
                  <th className="px-4 py-2 font-medium">Descrição</th>
                  <th className="px-4 py-2 w-32 font-medium text-center">Saldo Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {listaProdutos
                  .filter((p) =>
                    !buscaModal ||
                    (p.sku?.toLowerCase() || '').includes(buscaModal.toLowerCase()) ||
                    p.nome.toLowerCase().includes(buscaModal.toLowerCase())
                  )
                  .sort((a, b) => (a.sku || '').localeCompare(b.sku || '', undefined, { numeric: true }))
                  .map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors group"
                      onClick={() => handleSelecionar(p)}
                    >
                      <td className="px-4 py-2 font-medium">{p.sku || '-'}</td>
                      <td className="px-4 py-2 group-hover:font-medium">{p.nome}</td>
                      <td className="px-4 py-2 text-center">{p.quantidade_estoque ?? 0}</td>
                    </tr>
                  ))}
                {listaProdutos.filter((p) =>
                  !buscaModal ||
                  (p.sku?.toLowerCase() || '').includes(buscaModal.toLowerCase()) ||
                  p.nome.toLowerCase().includes(buscaModal.toLowerCase())
                ).length === 0 && (
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
              onClick={() => setModalProdutoOpen(false)}
              className="px-6 py-2 bg-background border border-border text-foreground rounded-md hover:bg-muted font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
