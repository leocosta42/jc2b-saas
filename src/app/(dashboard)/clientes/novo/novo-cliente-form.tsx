"use client"

import { ArrowLeft, Save, User, MapPin, Contact2, Loader2, Users } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createCliente } from "@/app/actions/clientes"
import { useTransition, useState } from "react"

export function NovoClienteForm({ nextCodigo = "" }: { nextCodigo?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [cep, setCep] = useState("")
  const [rua, setRua] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")
  const [codigo, setCodigo] = useState(nextCodigo)
  const [buscandoCep, setBuscandoCep] = useState(false)

  const handleCepBlur = async () => {
    const limpo = cep.replace(/\D/g, '')
    if (limpo.length === 8) {
      setBuscandoCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setRua(data.logradouro || "")
          setBairro(data.bairro || "")
          setCidade(data.localidade || "")
          setEstado(data.uf || "")
        } else {
          alert("CEP não encontrado. Verifique o número digitado.")
        }
      } catch {
        alert("Erro ao buscar CEP. Verifique sua conexão.")
      } finally {
        setBuscandoCep(false)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createCliente(formData)
      if (res.error) {
        alert(res.error)
      } else {
        router.push("/clientes")
        router.refresh()
      }
    })
  }

  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 pt-6 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link href="/clientes" className="hover:text-foreground transition-colors flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Link>
          </div>
          <div className="flex items-center gap-2 text-violet-500 mb-1">
            <Users className="h-5 w-5" />
            <span className="font-semibold tracking-wider uppercase text-sm">Módulo Comercial</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Novo Cliente</h1>
        </div>
      </div>

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">

            {/* Dados Principais */}
            <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <User className="h-5 w-5 text-violet-500" />
                  Dados Principais
                </h3>
              </div>
              <div className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="codigo" className="text-sm font-medium leading-none">Código do Cliente</label>
                    <button 
                      type="button" 
                      onClick={() => setCodigo(nextCodigo)}
                      className="text-xs text-violet-500 hover:text-violet-600 font-medium"
                    >
                      Gerar Sequencial
                    </button>
                  </div>
                  <input id="codigo" name="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex: CLI0001" className={inputClass} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="nome" className="text-sm font-medium leading-none">Nome / Razão Social <span className="text-red-500">*</span></label>
                  <input id="nome" name="nome" placeholder="Nome Completo ou Razão Social" className={inputClass} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="documento" className="text-sm font-medium leading-none">CPF/CNPJ</label>
                  <input id="documento" name="documento" placeholder="000.000.000-00 ou 00.000.000/0000-00" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="inscricao" className="text-sm font-medium leading-none">Insc. Estadual</label>
                  <input id="inscricao" name="inscricao" placeholder="Opcional para PF" className={inputClass} />
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <MapPin className="h-5 w-5 text-violet-500" />
                  Localização
                  {buscandoCep && <span className="text-sm text-violet-400 font-normal ml-2 animate-pulse">Buscando CEP...</span>}
                </h3>
              </div>
              <div className="p-6 grid gap-4 md:grid-cols-3">
                {/* CEP primeiro */}
                <div className="space-y-2 md:col-span-1">
                  <label htmlFor="cep" className="text-sm font-medium leading-none">CEP</label>
                  <input
                    id="cep" name="cep"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                    className={inputClass}
                    disabled={buscandoCep}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="rua" className="text-sm font-medium leading-none">Rua / Logradouro</label>
                  <input id="rua" name="rua" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Ex: Rua das Flores" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="numero" className="text-sm font-medium leading-none">Número</label>
                  <input id="numero" name="numero" placeholder="Ex: 123" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="complemento" className="text-sm font-medium leading-none">Complemento</label>
                  <input id="complemento" name="complemento" placeholder="Apto, Sala, Bloco..." className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="bairro" className="text-sm font-medium leading-none">Bairro</label>
                  <input id="bairro" name="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro" className={inputClass} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="cidade" className="text-sm font-medium leading-none">Cidade</label>
                  <input id="cidade" name="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Sua Cidade" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="estado" className="text-sm font-medium leading-none">Estado (UF)</label>
                  <input id="estado" name="estado" value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="UF" maxLength={2} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Contact2 className="h-5 w-5 text-violet-500" />
                  Contato
                </h3>
              </div>
              <div className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="celular" className="text-sm font-medium leading-none">Celular <span className="text-red-500">*</span></label>
                  <input id="celular" name="celular" placeholder="(00) 90000-0000" className={inputClass} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none">E-mail</label>
                  <input id="email" name="email" type="email" placeholder="cliente@email.com" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-2">
              <Link
                href="/clientes"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border/50 hover:bg-muted/50 h-10 px-4 py-2"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 h-10 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isPending ? "Salvando..." : "Salvar Cliente"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
