"use client"

import { useState, useTransition } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, Search, Download, Edit, CheckCircle2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { convertToPedido } from "@/app/actions/vendas"

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

export function OrcamentosTable({ data }: { data: Pedido[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filter, setFilter] = useState("")
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleAprovar = (id: string) => {
    if (!confirm("Tem certeza que deseja aprovar este orçamento? O estoque dos itens será baixado e ele se tornará um pedido.")) return
    
    startTransition(async () => {
      const res = await convertToPedido(id)
      if (res.error) {
        alert(res.error)
      } else {
        router.refresh()
      }
    })
  }

  const filteredData = data.filter(pedido => 
    pedido.cliente.toLowerCase().includes(filter.toLowerCase()) ||
    pedido.numero.toString().includes(filter)
  )

  const columns: ColumnDef<Pedido>[] = [
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
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex justify-end gap-2">
            {p.tipo === 'ORCAMENTO' && (
              <button 
                onClick={() => handleAprovar(p.id)}
                disabled={isPending}
                title="Aprovar Orçamento e Gerar Pedido"
                className="h-8 flex items-center gap-1 px-2 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span className="text-xs font-semibold hidden lg:inline">Aprovar</span>
              </button>
            )}
            <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
              <Download className="h-4 w-4" />
            </button>
            <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
              <Edit className="h-4 w-4" />
            </button>
          </div>
        )
      },
    },
  ]

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
