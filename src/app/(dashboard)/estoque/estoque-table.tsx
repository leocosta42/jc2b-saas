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
import { MoreHorizontal, ArrowUpDown, Search, Edit, Trash2, Copy } from "lucide-react"
import Link from "next/link"
import { deleteProduto } from '@/app/actions/produtos'

const ActionCell = ({ row }: { row: any }) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const handleDelete = async () => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      setIsDeleting(true)
      const res = await deleteProduto(row.original.id)
      setIsDeleting(false)
      if (res.error) alert(res.error)
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Link 
        href={`/estoque/novo?copy_id=${row.original.id}`}
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-indigo-500 transition-colors"
        title="Copiar Produto"
      >
        <Copy className="h-4 w-4" />
      </Link>
      <Link 
        href={`/estoque/novo?edit_id=${row.original.id}`}
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary transition-colors"
        title="Editar Produto"
      >
        <Edit className="h-4 w-4" />
      </Link>
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        title="Excluir Produto"
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

export type Produto = {
  id: string
  codigo: string
  descricao: string
  um: string
  valor_custo: number
  valor_venda: number
  lucro_rs: number
  lucro_porcentagem: string
  saldo_estoque: number
  custo_estoque_atual: number
  fornecedor: string
  cod_forn: string
}

export const columns: ColumnDef<Produto>[] = [
  {
    accessorKey: "codigo",
    header: "Código",
    cell: ({ row }) => <div className="text-indigo-500 font-semibold">{row.getValue("codigo")}</div>,
  },
  {
    accessorKey: "descricao",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
      >
        Descrição
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => <div className="font-medium whitespace-nowrap">{row.getValue("descricao")}</div>,
  },
  {
    accessorKey: "um",
    header: "U.M",
    cell: ({ row }) => <div className="text-muted-foreground text-xs">{row.getValue("um")}</div>,
  },
  {
    accessorKey: "valor_custo",
    header: () => <div className="text-right">Valor Custo R$</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valor_custo"))
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
      return <div className="text-right">{formatted}</div>
    },
  },
  {
    accessorKey: "valor_venda",
    header: () => <div className="text-right">Valor Venda R$</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valor_venda"))
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
      return <div className="text-right font-medium text-indigo-500">{formatted}</div>
    },
  },
  {
    accessorKey: "lucro_rs",
    header: () => <div className="text-right">Lucro R$</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("lucro_rs"))
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
      return <div className="text-right text-emerald-500">{formatted}</div>
    },
  },
  {
    accessorKey: "lucro_porcentagem",
    header: "Lucro %",
    cell: ({ row }) => <div className="text-emerald-500">{row.getValue("lucro_porcentagem")}</div>,
  },
  {
    accessorKey: "saldo_estoque",
    header: () => <div className="text-right">Saldo Estoque</div>,
    cell: ({ row }) => {
      const qtd = parseInt(row.getValue("saldo_estoque"))
      return <div className="text-right font-medium">{qtd}</div>
    },
  },
  {
    accessorKey: "custo_estoque_atual",
    header: () => <div className="text-right">Custo Estoque Atual R$</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("custo_estoque_atual"))
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
      return <div className="text-right">{formatted}</div>
    },
  },
  {
    accessorKey: "fornecedor",
    header: "Fornecedor",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{row.original.cod_forn}</span>
        <span className="whitespace-nowrap">{row.getValue("fornecedor")}</span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell row={row} />,
  },
]

interface DataTableProps {
  data: Produto[]
}

export function EstoqueTable({ data }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filter, setFilter] = useState("")

  const filteredData = data.filter(item => 
    item.descricao.toLowerCase().includes(filter.toLowerCase()) ||
    item.codigo.toLowerCase().includes(filter.toLowerCase())
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
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por código ou descrição..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 pl-8 pr-3 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
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
                    <td key={cell.id} className="p-4 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <span className="text-lg">Nenhum produto encontrado.</span>
                  </div>
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
