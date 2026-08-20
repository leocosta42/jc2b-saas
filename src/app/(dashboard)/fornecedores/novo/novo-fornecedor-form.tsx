"use client"

import { ArrowLeft, Save, MapPin, Contact2, Loader2, Truck, Building2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createFornecedor } from "@/app/actions/fornecedores"
import { useTransition, useState } from "react"

interface Props {
  nextCodigo: string
}

export function NovoFornecedorForm({ nextCodigo }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [codigoAuto, setCodigoAuto] = useState(nextCodigo)
  const [cep, setCep] = useState("")
  const [rua, setRua] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")
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
      const res = await createFornecedor(formData)
      if (res.error) {
        alert(res.error)
      } else {
        router.push("/fornecedores")
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

            {/* Dados Principais */}
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
                  <input id="codigo" name="codigo" value={codigoAuto} onChange={(e) => setCodigoAuto(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="nome" className="text-sm font-medium leading-none">Nome / Razão Social <span className="text-red-500">*</span></label>
                  <input id="nome" name="nome" placeholder="Razão Social ou Nome Fantasia" className={inputClass} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="documento" className="text-sm font-medium leading-none">CNPJ / CPF</label>
                  <input id="documento" name="documento" placeholder="00.000.000/0000-00" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="inscricao" className="text-sm font-medium leading-none">Insc. Estadual</label>
                  <input id="inscricao" name="inscricao" placeholder="000.000.000.000" className={inputClass} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="bloqueado" className="text-sm font-medium leading-none text-red-500">Status de Bloqueio</label>
                  <select id="bloqueado" name="bloqueado" className={inputClass} defaultValue="false">
                    <option value="false">Ativo / Liberado</option>
                    <option value="true">Bloqueado</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="md:col-span-2 rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Localização
                  {buscandoCep && <span className="text-sm text-orange-400 font-normal ml-2 animate-pulse">Buscando CEP...</span>}
                </h3>
              </div>
              <div className="p-6 grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-1">
                  <label htmlFor="cep" className="text-sm font-medium leading-none">CEP</label>
                  <input id="cep" name="cep" value={cep} onChange={(e) => setCep(e.target.value)} onBlur={handleCepBlur} placeholder="00000-000" className={inputClass} disabled={buscandoCep} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="rua" className="text-sm font-medium leading-none">Rua / Logradouro</label>
                  <input id="rua" name="rua" value={rua} onChange={(e) => setRua(e.target.value)} placeholder="Ex: Av. Industrial, 1000" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="numero" className="text-sm font-medium leading-none">Número</label>
                  <input id="numero" name="numero" placeholder="Ex: 500" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="complemento" className="text-sm font-medium leading-none">Complemento</label>
                  <input id="complemento" name="complemento" placeholder="Galpão, Sala, etc." className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="bairro" className="text-sm font-medium leading-none">Bairro</label>
                  <input id="bairro" name="bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Distrito Industrial" className={inputClass} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="cidade" className="text-sm font-medium leading-none">Cidade</label>
                  <input id="cidade" name="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade" className={inputClass} />
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
                  <Contact2 className="h-5 w-5 text-orange-500" />
                  Contato
                </h3>
              </div>
              <div className="p-6 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="celular" className="text-sm font-medium leading-none">Celular / Telefone <span className="text-red-500">*</span></label>
                  <input id="celular" name="celular" placeholder="(00) 00000-0000" className={inputClass} required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none">E-mail</label>
                  <input id="email" name="email" type="email" placeholder="nfe@fornecedor.com.br" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-2">
              <Link
                href="/fornecedores"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-border/50 hover:bg-muted/50 h-10 px-4 py-2"
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
