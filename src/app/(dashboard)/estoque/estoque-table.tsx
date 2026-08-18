'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal, AlertTriangle, CheckCircle2 } from "lucide-react"

export type Produto = {
  id: string
  sku: string | null
  nome: string
  preco_venda: number
  quantidade_estoque: number
  estoque_minimo: number
}

export const columns: ColumnDef<Produto>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <div className="text-muted-foreground font-mono text-xs">{row.getValue("sku") || '-'}</div>,
  },
  {
    accessorKey: "nome",
    header: "Produto",
    cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("nome")}</div>,
  },
  {
    accessorKey: "preco_venda",
    header: "Preço de Venda",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("preco_venda"))
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount)
      return <div className="text-foreground">{formatted}</div>
    },
  },
  {
    accessorKey: "quantidade_estoque",
    header: "Estoque Atual",
    cell: ({ row }) => {
      const qtd = parseInt(row.getValue("quantidade_estoque"))
      return <div className="font-medium">{qtd} un.</div>
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const qtd = parseInt(row.getValue("quantidade_estoque"))
      const min = parseInt(row.original.estoque_minimo as any)
      
      if (qtd <= min) {
        return (
          <div className="flex items-center text-destructive text-sm font-medium bg-destructive/10 w-fit px-2.5 py-1 rounded-full border border-destructive/20">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Reordem
          </div>
        )
      }
      return (
        <div className="flex items-center text-emerald-600 text-sm font-medium bg-emerald-500/10 w-fit px-2.5 py-1 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Em dia
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <button className="h-8 w-8 p-0 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors ml-auto">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )
    },
  },
]

interface DataTableProps<TData> {
  data: TData[]
}

export function EstoqueTable<TData>({
  data,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns: columns as any,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm text-card-foreground shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/30">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} className="h-12 px-6 text-left align-middle font-medium text-muted-foreground">
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
                className="transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-6 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <span className="text-lg">Nenhum produto cadastrado no estoque.</span>
                  <span className="text-sm">Clique em "Novo Produto" para começar.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
