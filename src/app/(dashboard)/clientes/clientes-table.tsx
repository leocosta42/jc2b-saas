"use client"
import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table"
import { ArrowUpDown, Search, Edit, Trash2, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { deleteCliente } from "@/app/actions/clientes"
import { ConfirmModal } from "@/app/components/ConfirmModal"
import { toast } from "sonner"

export type Cliente = {
  id: string
  codigo?: string
  nome: string
  cpf_cnpj: string
  celular: string
  email: string
  cidade?: string
  estado?: string
  status: "Ativo" | "Inativo"
  bloqueado?: boolean
}

export const columns: ColumnDef<Cliente>[] = [
  {
    accessorKey: "codigo",
    header: ({ column }) => (
      <button
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
      >
        Código
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => <span className="font-semibold text-violet-500">{row.getValue("codigo") || '-'}</span>,
  },
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
      const bloqueado = row.original.bloqueado
      const status = row.getValue("status") as string
      
      if (bloqueado) {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-red-500/10 text-red-500 border-red-500/20">
            Bloqueado
          </span>
        )
      }

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

export function ClientesTable({ data }: { data: Cliente[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentQ = searchParams.get('q') || ""
  const currentSort = searchParams.get('sort')
  const currentOrder = searchParams.get('order')

  const initialSorting: SortingState = currentSort ? [{ id: currentSort, desc: currentOrder === 'desc' }] : []
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [filter, setFilter] = useState(currentQ)

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (filter) {
        params.set('q', filter)
      } else {
        params.delete('q')
      }
      
      if (currentQ !== filter) {
        params.delete('page')
        router.push(`${pathname}?${params.toString()}`)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [filter, currentQ, pathname, router, searchParams])

  useEffect(() => {
    if (!currentSort) {
      const savedSort = localStorage.getItem('jc2b_clientes_sort')
      if (savedSort) {
        try {
          const { sort, order } = JSON.parse(savedSort)
          if (sort) {
            const params = new URLSearchParams(searchParams.toString())
            params.set('sort', sort)
            params.set('order', order || 'asc')
            router.push(`${pathname}?${params.toString()}`)
            setSorting([{ id: sort, desc: order === 'desc' }])
          }
        } catch (e) {}
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSortingChange = (updaterOrValue: any) => {
    const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue
    setSorting(newSorting)
    
    const params = new URLSearchParams(searchParams.toString())
    if (newSorting.length > 0) {
      const { id, desc } = newSorting[0]
      params.set('sort', id)
      params.set('order', desc ? 'desc' : 'asc')
      localStorage.setItem('jc2b_clientes_sort', JSON.stringify({ sort: id, order: desc ? 'desc' : 'asc' }))
    } else {
      params.delete('sort')
      params.delete('order')
      localStorage.removeItem('jc2b_clientes_sort')
    }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: handleSortingChange,
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    state: { sorting },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Buscar por código, nome ou documento..."
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
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async () => {
    setIsPending(true)
    const res = await deleteCliente(cliente.id)
    setIsPending(false)
    if (res.error) {
      toast.error("Erro ao excluir", { description: res.error })
    } else {
      toast.success(`Cliente "${cliente.nome}" excluído com sucesso.`)
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Link
        href={`/clientes/${cliente.id}/editar`}
        title="Editar cliente"
        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
      >
        <Edit className="h-4 w-4" />
      </Link>
      <ConfirmModal
        title="Excluir Cliente"
        description={`Tem certeza que deseja excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`}
        variant="danger"
        confirmText="Excluir"
        onConfirm={handleDelete}
        trigger={
          <button
            disabled={isPending}
            title="Excluir cliente"
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        }
      />
    </div>
  )
}
