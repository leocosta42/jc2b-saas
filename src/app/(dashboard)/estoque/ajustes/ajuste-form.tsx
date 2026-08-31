'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search, Save, Loader2, PackageSearch } from 'lucide-react'
import { searchProdutosAPI } from '@/app/actions/vendas'
import { criarAjusteEstoque } from '@/app/actions/estoque'

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

export function AjusteForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<Produto[]>([])
  const [buscando, setBuscando] = useState(false)
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)

  const [novoSaldo, setNovoSaldo] = useState<number | string>('')
  const [motivo, setMotivo] = useState('entrada_manual')
  const [observacoes, setObservacoes] = useState('')

  const handleBuscar = async () => {
    if (busca.trim().length < 2) {
      toast.error('Digite pelo menos 2 caracteres para buscar.')
      return
    }
    setBuscando(true)
    const res = await searchProdutosAPI(busca)
    setBuscando(false)
    setResultados(res)
    if (res.length === 0) toast.error('Nenhum produto encontrado.')
  }

  const handleSelecionar = (p: Produto) => {
    setProdutoSelecionado(p)
    setResultados([])
    setBusca('')
    setNovoSaldo(p.quantidade_estoque ?? 0)
    setMotivo('entrada_manual')
    setObservacoes('')
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
    <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border/50 bg-muted/20">
        <h3 className="flex items-center gap-2 font-semibold">
          <PackageSearch className="h-4 w-4 text-indigo-500" />
          Novo Ajuste
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {!produtoSelecionado ? (
          <div className="space-y-3">
            <label className="text-sm font-medium">Buscar Produto</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBuscar() } }}
                  placeholder="Buscar por código ou descrição..."
                  className="w-full h-10 rounded-md border border-input bg-background/50 pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <button
                type="button"
                onClick={handleBuscar}
                disabled={buscando}
                className="h-10 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
              </button>
            </div>

            {resultados.length > 0 && (
              <div className="border border-border/50 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 font-medium">Código</th>
                      <th className="px-3 py-2 font-medium">Descrição</th>
                      <th className="px-3 py-2 font-medium text-center">Saldo Atual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {resultados.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => handleSelecionar(p)}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <td className="px-3 py-2 font-medium">{p.sku || '-'}</td>
                        <td className="px-3 py-2">{p.nome}</td>
                        <td className="px-3 py-2 text-center">{p.quantidade_estoque ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
  )
}
