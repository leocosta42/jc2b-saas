"use client"

import { useState, useMemo } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, Search, Download, Edit, CheckCircle2, Loader2, Printer, Trash2 } from "lucide-react"
import { convertToPedido, deleteDocumento } from "@/app/actions/vendas"
import Link from "next/link"
import { toast } from "sonner"

export type Pedido = {
  id: string
  numero: number
  tipo: string
  cod_cliente: string
  cliente: string
  data_emissao: string
  data_entrega: string
  valor_total: number
  cod_vendedor: string
  vendedor: string
  comissao: string
  comissao_venda: number
  mes: string
}

const ActionCell = ({ row }: { row: any }) => {
  const p = row.original
  const [isPending, setIsPending] = useState(false)

  const handleAprovar = async () => {
    if (!confirm("Tem certeza que deseja aprovar este orçamento? O estoque dos itens será baixado e ele se tornará um pedido.")) return
    
    setIsPending(true)
    const res = await convertToPedido(p.id)
    setIsPending(false)
    if (res.error) {
      toast.error("Erro ao aprovar", { description: res.error })
    } else {
      toast.success("Orçamento aprovado! Pedido gerado com sucesso.")
    }
  }

  const handleDelete = async () => {
    if(!confirm(`Tem certeza que deseja excluir este ${p.tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido'}?`)) return
    
    setIsPending(true)
    const res = await deleteDocumento(p.id, p.tipo as 'ORCAMENTO' | 'PEDIDO')
    setIsPending(false)
    if (res.error) {
      toast.error("Erro ao excluir", { description: res.error })
    } else {
      toast.success(`${p.tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido'} excluído com sucesso.`)
    }
  }

  const handleWhatsApp = () => {
    const url = `${window.location.origin}/imprimir/${p.id}`
    const text = `Olá! Segue o link do seu ${p.tipo === 'ORCAMENTO' ? 'Orçamento' : 'Pedido'} nº ${p.numero}:\n\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/imprimir/${p.id}`
    navigator.clipboard.writeText(url)
    toast.success("Link copiado para a área de transferência!")
  }

  return (
    <div className="flex justify-end gap-1.5">
      {p.tipo === 'ORCAMENTO' && (
        <button 
          onClick={handleAprovar}
          disabled={isPending}
          title="Aprovar Orçamento"
          className="h-8 flex items-center gap-1 px-2 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          <span className="text-xs font-semibold hidden xl:inline">Aprovar</span>
        </button>
      )}
      <button 
        onClick={handleWhatsApp}
        title="Enviar por WhatsApp"
        className="h-8 w-8 flex items-center justify-center rounded-md bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
      </button>
      <button 
        onClick={handleCopyLink}
        title="Copiar Link Público"
        className="h-8 w-8 flex items-center justify-center rounded-md bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
      </button>
      <a 
        href={`/imprimir/${p.id}`}
        target="_blank"
        title="Imprimir / Gerar PDF"
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
      >
        <Printer className="h-4 w-4" />
      </a>
      <Link 
        href={`/${p.tipo === 'ORCAMENTO' ? 'orcamentos' : 'pedidos'}/novo?edit_id=${p.id}`}
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
        title="Editar"
      >
        <Edit className="h-4 w-4" />
      </Link>
      <button 
        onClick={handleDelete}
        disabled={isPending}
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors disabled:opacity-50"
        title="Excluir"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export const columns: ColumnDef<Pedido>[] = [
  {
    accessorKey: "numero",
    header: "Número",
    cell: ({ row }) => <span className="font-semibold text-indigo-500">#{row.getValue("numero")}</span>,
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => {
      const tipo = row.getValue("tipo") as string
      const color = tipo === 'PEDIDO' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>{tipo}</span>
    },
  },
  {
    accessorKey: "cliente",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
      >
        Cliente
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => <div className="font-medium whitespace-nowrap">{row.getValue("cliente")}</div>,
  },
  {
    accessorKey: "data_emissao",
    header: "Emissão",
    cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("data_emissao")}</div>,
  },
  {
    accessorKey: "valor_total",
    header: () => <div className="text-right">Valor Total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valor_total")) || 0
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell row={row} />,
  },
]

export function OrcamentosTable({ data }: { data: Pedido[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filter, setFilter] = useState("")

  const filteredData = useMemo(() => 
    data.filter(pedido => 
      pedido.cliente.toLowerCase().includes(filter.toLowerCase()) ||
      pedido.numero.toString().includes(filter)
    ),
    [data, filter]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por nº ou cliente..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 pl-8 pr-3 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/50">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-muted/40"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Nenhum pedido encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-muted-foreground pl-1">
        Mostrando {table.getRowModel().rows.length} de {data.length} registros.
      </div>
    </div>
  )
}
