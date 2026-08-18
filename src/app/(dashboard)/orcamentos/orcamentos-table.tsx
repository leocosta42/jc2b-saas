"use client"

import { useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, Search, Download, Edit } from "lucide-react"

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
        const color = tipo === 'Venda' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
        return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>{tipo}</span>
      },
    },
    {
      accessorKey: "cod_cliente",
      header: "Cód Cliente",
      cell: ({ row }) => <div className="text-muted-foreground text-xs">{row.getValue("cod_cliente")}</div>,
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
      accessorKey: "data_entrega",
      header: "Entrega",
      cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("data_entrega")}</div>,
    },
    {
      accessorKey: "valor_total",
      header: () => <div className="text-right">Valor Total</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("valor_total"))
        const formatted = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: "vendedor",
      header: "Vendedor",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">{row.original.cod_vendedor}</span>
          <span className="whitespace-nowrap">{row.getValue("vendedor")}</span>
        </div>
      ),
    },
    {
      accessorKey: "comissao_venda",
      header: () => <div className="text-right">Comissão</div>,
      cell: ({ row }) => {
        const comissao = parseFloat(row.getValue("comissao_venda"))
        const percent = row.original.comissao
        const formatted = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(comissao)
        return (
          <div className="flex flex-col text-right">
            <span className="text-emerald-500 font-medium">{formatted}</span>
            <span className="text-xs text-muted-foreground">{percent}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "mes",
      header: "Mês",
    },
    {
      id: "actions",
      cell: () => (
        <div className="flex justify-end gap-1">
          <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
            <Download className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
            <Edit className="h-4 w-4" />
          </button>
        </div>
      ),
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
