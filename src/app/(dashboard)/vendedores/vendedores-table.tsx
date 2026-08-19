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
import { ArrowUpDown, Search, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { deleteVendedor } from "@/app/actions/vendedores"

export type Vendedor = {
  id: string
  codigo?: string
  nome: string
  cpf_cnpj?: string
  telefone: string | null
  email: string | null
  comissao_percentual: number
  status: "Ativo" | "Inativo"
}

export const columns: ColumnDef<Vendedor>[] = [
  {
    accessorKey: "codigo",
    header: "Código",
    cell: ({ row }) => <span className="font-semibold text-blue-500">{row.getValue("codigo") || '-'}</span>,
  },
  {
    accessorKey: "nome",
    header: ({ column }) => {
      return (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
        >
          Nome
          <ArrowUpDown className="h-4 w-4" />
        </button>
      )
    },
    cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("nome")}</div>,
  },
  {
    accessorKey: "cpf_cnpj",
    header: "CPF/CNPJ",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("cpf_cnpj") || '-'}</div>,
  },
  {
    accessorKey: "telefone",
    header: "Telefone",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("telefone") || '-'}</div>,
  },
  {
    accessorKey: "comissao_percentual",
    header: "Comissão (%)",
    cell: ({ row }) => {
      const val = parseFloat(row.getValue("comissao_percentual"))
      return <div className="font-medium">{val.toFixed(2)}%</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const bgColor = status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bgColor}`}>
          {status}
        </span>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const vendedor = row.original
      return (
        <ActionButtons vendedor={vendedor} />
      )
    },
  },
]

export function VendedoresTable({ data }: { data: Vendedor[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filter, setFilter] = useState("")

  const filteredData = data.filter(vend => 
    vend.nome.toLowerCase().includes(filter.toLowerCase()) ||
    (vend.codigo && vend.codigo.toLowerCase().includes(filter.toLowerCase()))
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
            placeholder="Buscar por código ou nome..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 pl-8 pr-3 py-2 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
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
                <td colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  Nenhum vendedor encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-muted-foreground pl-1">
        Mostrando {table.getRowModel().rows.length} de {data.length} vendedores.
      </div>
    </div>
  )
}

function ActionButtons({ vendedor }: { vendedor: Vendedor }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`Tem certeza que deseja excluir o vendedor "${vendedor.nome}"? Esta ação não pode ser desfeita.`)) return

    startTransition(async () => {
      const res = await deleteVendedor(vendedor.id)
      if (res.error) {
        alert("Erro ao excluir: " + res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => router.push(`/vendedores/${vendedor.id}/editar`)}
        title="Editar vendedor"
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Excluir vendedor"
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
