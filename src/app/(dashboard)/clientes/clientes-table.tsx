'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

export type Cliente = {
  id: string
  nome: string
  documento: string | null
  telefone: string | null
  email: string | null
}

export const columns: ColumnDef<Cliente>[] = [
  {
    accessorKey: "nome",
    header: "Nome do Cliente",
    cell: ({ row }) => <div className="font-medium text-foreground">{row.getValue("nome")}</div>,
  },
  {
    accessorKey: "documento",
    header: "CPF/CNPJ",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("documento") || '-'}</div>,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("email") || '-'}</div>,
  },
  {
    accessorKey: "telefone",
    header: "Telefone",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("telefone") || '-'}</div>,
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

export function ClientesTable<TData>({
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
                  <span className="text-lg">Nenhum cliente cadastrado.</span>
                  <span className="text-sm">Clique em "Novo Cliente" para começar.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
