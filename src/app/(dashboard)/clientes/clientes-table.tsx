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
import { ArrowUpDown, Search, Edit, Trash2, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { deleteCliente } from "@/app/actions/clientes"

export type Cliente = {
  id: string
  nome: string
  cpf_cnpj: string
  celular: string
  email: string
  cidade?: string
  estado?: string
  status: "Ativo" | "Inativo"
}

export function ClientesTable({ data }: { data: Cliente[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [filter, setFilter] = useState("")

  const filteredData = data.filter(cliente =>
    cliente.nome.toLowerCase().includes(filter.toLowerCase()) ||
    (cliente.cpf_cnpj && cliente.cpf_cnpj.includes(filter))
  )

  const columns: ColumnDef<Cliente>[] = [
    {
      accessorKey: "nome",
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
        >
          Nome / Razão Social
          <ArrowUpDown className="h-4 w-4" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Users className="h-4 w-4" />
          </div>
          <span className="font-medium text-foreground">{row.getValue("nome")}</span>
        </div>
      ),
    },
    {
      accessorKey: "cpf_cnpj",
      header: "CPF/CNPJ",
      cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("cpf_cnpj") || '-'}</div>,
    },
    {
      accessorKey: "celular",
      header: "Celular",
      cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("celular") || '-'}</div>,
    },
    {
      accessorKey: "email",
      header: "E-mail",
      cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email") || '-'}</div>,
    },
    {
      accessorKey: "cidade",
      header: "Localização",
      cell: ({ row }) => {
        const cidade = row.getValue("cidade") as string
        const estado = row.original.estado
        return <div className="text-muted-foreground">{cidade && estado ? `${cidade} - ${estado}` : '-'}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const bgColor = status === 'Ativo'
          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
          : 'bg-muted text-muted-foreground border-border'
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bgColor}`}>
            {status}
          </span>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => <ActionButtons cliente={row.original} />,
    },
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por nome ou CPF/CNPJ..."
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
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/50">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/40">
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
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-muted-foreground pl-1">
        Mostrando {table.getRowModel().rows.length} de {data.length} clientes.
      </div>
    </div>
  )
}

function ActionButtons({ cliente }: { cliente: Cliente }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`)) return

    startTransition(async () => {
      const res = await deleteCliente(cliente.id)
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
        onClick={() => router.push(`/clientes/${cliente.id}/editar`)}
        title="Editar cliente"
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        title="Excluir cliente"
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-40"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
