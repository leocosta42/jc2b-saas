'use client'

import { useState } from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, Search, Download, Filter } from "lucide-react"

export type Estatistica = {
  id: string
  cod_cliente: string
  mes: string
  nome: string // Nome do cliente
  pedido: string
  data_emissao: string
  item: string
  codigo_produto: string
  descricao: string
  qtde: number
  um: string
  valor_unit: number
  valor_total: number
  valor_custo: number
  lucro_venda: number
  identificador: string
}

export const columns: ColumnDef<Estatistica>[] = [
  {
    accessorKey: "cod_cliente",
    header: "Cód Cliente",
    cell: ({ row }) => <div className="text-muted-foreground text-xs whitespace-nowrap">{row.getValue("cod_cliente")}</div>,
  },
  {
    accessorKey: "mes",
    header: "Mês",
    cell: ({ row }) => <div className="whitespace-nowrap capitalize text-xs">{row.getValue("mes")}</div>,
  },
  {
    accessorKey: "nome",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
      >
        Nome
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => <div className="font-medium whitespace-nowrap">{row.getValue("nome")}</div>,
  },
  {
    accessorKey: "pedido",
    header: "Pedido",
    cell: ({ row }) => <div className="font-semibold text-teal-600 whitespace-nowrap">#{row.getValue("pedido")}</div>,
  },
  {
    accessorKey: "data_emissao",
    header: "Data Emissão",
    cell: ({ row }) => <div className="whitespace-nowrap text-xs">{row.getValue("data_emissao")}</div>,
  },
  {
    accessorKey: "item",
    header: "Item",
    cell: ({ row }) => <div className="text-center text-xs">{row.getValue("item")}</div>,
  },
  {
    accessorKey: "codigo_produto",
    header: "Cód Produto",
    cell: ({ row }) => <div className="text-muted-foreground text-xs whitespace-nowrap">{row.getValue("codigo_produto")}</div>,
  },
  {
    accessorKey: "descricao",
    header: "Descrição",
    cell: ({ row }) => <div className="whitespace-nowrap min-w-[150px]">{row.getValue("descricao")}</div>,
  },
  {
    accessorKey: "qtde",
    header: () => <div className="text-right">Qtde</div>,
    cell: ({ row }) => <div className="text-right">{row.getValue("qtde")}</div>,
  },
  {
    accessorKey: "um",
    header: "U.M",
    cell: ({ row }) => <div className="text-xs text-muted-foreground">{row.getValue("um")}</div>,
  },
  {
    accessorKey: "valor_unit",
    header: () => <div className="text-right">Valor R$ unit.</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valor_unit"))
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
      return <div className="text-right whitespace-nowrap">{formatted}</div>
    },
  },
  {
    accessorKey: "valor_total",
    header: () => <div className="text-right">Valor R$ total</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valor_total"))
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
      return <div className="text-right font-medium text-teal-600 whitespace-nowrap">{formatted}</div>
    },
  },
  {
    accessorKey: "valor_custo",
    header: () => <div className="text-right">Valor R$ custo</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valor_custo"))
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
      return <div className="text-right whitespace-nowrap">{formatted}</div>
    },
  },
  {
    accessorKey: "lucro_venda",
    header: () => <div className="text-right">Lucro venda R$</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("lucro_venda"))
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
      return <div className="text-right font-medium text-emerald-500 whitespace-nowrap">{formatted}</div>
    },
  },
  {
    accessorKey: "identificador",
    header: "Identificador",
    cell: ({ row }) => <div className="text-muted-foreground text-xs whitespace-nowrap">{row.getValue("identificador")}</div>,
  },
]

interface DataTableProps {
  data: Estatistica[]
}

export function EstatisticasTable({ data }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filter, setFilter] = useState("")

  const filteredData = data.filter(item => 
    item.nome.toLowerCase().includes(filter.toLowerCase()) ||
    item.pedido.includes(filter) ||
    item.descricao.toLowerCase().includes(filter.toLowerCase())
  )

  const table = useReactTable({
    data: filteredData,
    columns: columns as any,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por cliente, pedido ou produto..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 pl-8 pr-3 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
          />
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-10 px-4 py-2 border border-border/50 bg-card/50 backdrop-blur-sm">
            <Filter className="mr-2 h-4 w-4" /> Filtros Avançados
          </button>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-10 px-4 py-2 border border-border/50 bg-card/50 backdrop-blur-sm text-teal-600 hover:text-teal-700">
            <Download className="mr-2 h-4 w-4" /> Exportar Excel
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm text-card-foreground shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  )
                })}
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
                    <td key={cell.id} className="p-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-lg">Nenhum registro encontrado.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between pl-1">
        <div className="text-sm text-muted-foreground">
          Mostrando {table.getRowModel().rows.length} de {data.length} registros.
        </div>
      </div>
    </div>
  )
}
