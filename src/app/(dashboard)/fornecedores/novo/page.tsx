"use client"

import { FileText, ArrowLeft, Save, User, MapPin, Calendar, Package, Plus, Trash2, Calculator, Building2, Contact2, Loader2, Truck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createFornecedor } from "@/app/actions/fornecedores"
import { useTransition } from "react"

export default function NovoFornecedorPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await createFornecedor(formData)
      if (res.error) {
        alert(res.error)
      } else {
        router.push("/fornecedores")
        router.refresh()
      }
    })
  }

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link href="/fornecedores" className="hover:text-foreground transition-colors flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </div>
          <div className="flex items-center gap-2 text-orange-500 mb-1">
            <Truck className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo de Suprimentos</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Novo Fornecedor</h1>
        </div>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Informações da Empresa */}
            <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Building2 className="h-5 w-5 text-orange-500" />
                  Dados Principais
                </h3>
              </div>
              <div className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="codigo" className="text-sm font-medium leading-none">Código</label>
                  <input id="codigo" name="codigo" placeholder="FORN001" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="nome" className="text-sm font-medium leading-none">Nome</label>
                  <input id="nome" name="nome" placeholder="Razão Social ou Nome Fantasia" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="documento" className="text-sm font-medium leading-none">CPF/CNPJ</label>
                  <input id="documento" name="documento" placeholder="00.000.000/0000-00" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="inscricao" className="text-sm font-medium leading-none">Insc. Estadual</label>
                  <input id="inscricao" name="inscricao" placeholder="000.000.000.000" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Localização
                </h3>
              </div>
              <div className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="cep" className="text-sm font-medium leading-none">CEP</label>
                  <input id="cep" name="cep" placeholder="00000-000" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="rua" className="text-sm font-medium leading-none">Rua, Nº</label>
                  <input id="rua" name="rua" placeholder="Av. Principal, 1000" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="complemento" className="text-sm font-medium leading-none">Complemento</label>
                  <input id="complemento" name="complemento" placeholder="Galpão, Sala, etc." className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="bairro" className="text-sm font-medium leading-none">Bairro</label>
                  <input id="bairro" name="bairro" placeholder="Distrito Industrial" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="cidade" className="text-sm font-medium leading-none">Cidade</label>
                  <input id="cidade" name="cidade" placeholder="Cidade" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="estado" className="text-sm font-medium leading-none">Estado</label>
                  <input id="estado" name="estado" placeholder="UF" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Contact2 className="h-5 w-5 text-orange-500" />
                  Contato
                </h3>
              </div>
              <div className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="celular" className="text-sm font-medium leading-none">Celular / Telefone</label>
                  <input id="celular" name="celular" placeholder="(00) 00000-0000" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none">E-mail</label>
                  <input id="email" name="email" type="email" placeholder="nfe@fornecedor.com.br" className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-2">
              <Link 
                href="/fornecedores"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border/50 hover:bg-muted/50 h-10 px-4 py-2"
                aria-disabled={isPending}
              >
                Cancelar
              </Link>
              <button 
                type="submit" 
                disabled={isPending} 
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20 h-10 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isPending ? "Salvando..." : "Salvar Fornecedor"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
