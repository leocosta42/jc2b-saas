'use client'

import { Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function ClienteForm() {
  return (
    <div className="max-w-2xl rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
      <form className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome / Razão Social <span className="text-destructive">*</span></label>
            <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="Ex: Tech Solutions Brasil LTDA" required />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">CPF / CNPJ</label>
              <input type="text" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <input type="tel" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="(00) 00000-0000" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">E-mail</label>
            <input type="email" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="contato@empresa.com.br" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Endereço Completo</label>
            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" placeholder="Rua, número, bairro, cidade, estado..." />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-border/50">
          <button type="button" className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow-md h-10 px-5 py-2">
            <Save className="mr-2 h-4 w-4" /> Salvar Cliente
          </button>
          <Link href="/clientes" className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all border border-input hover:bg-muted h-10 px-5 py-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
