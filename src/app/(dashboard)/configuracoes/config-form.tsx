"use client"

import { useState, useTransition } from "react"
import { Save, Building2, Image as ImageIcon, MapPin, Contact2, Loader2, Upload } from "lucide-react"
import { updateTenantConfig } from "@/app/actions/configuracoes"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ConfigFormProps {
  config?: {
    name: string
    cnpj?: string | null
    telefone?: string | null
    email?: string | null
    endereco?: string | null
    logo_url?: string | null
  }
}

export function ConfigForm({ config }: ConfigFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Em um ambiente real, teríamos um upload para S3/Supabase Storage.
  // Aqui, usaremos um campo de URL ou deixaremos o logo-placeholder como padrão.
  const [logoPreview, setLogoPreview] = useState(config?.logo_url || "/logo.png")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    startTransition(async () => {
      const res = await updateTenantConfig(formData)
      if (res.error) {
        toast.error("Erro ao salvar", { description: res.error })
      } else {
        toast.success("Configurações salvas com sucesso!")
        router.refresh()
      }
    })
  }

  const inputClass = "flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-60"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Logotipo */}
      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <ImageIcon className="h-5 w-5 text-violet-500" />
            Identidade Visual
          </h3>
        </div>
        <div className="p-6 grid gap-6 sm:grid-cols-2 items-center">
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border/50 rounded-lg bg-background/50 h-40">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-muted-foreground flex flex-col items-center">
                <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-sm">Sem logotipo</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="logo_url" className="text-sm font-medium leading-none">URL do Logotipo</label>
              <input 
                id="logo_url" 
                name="logo_url" 
                defaultValue={config?.logo_url || ""}
                onChange={(e) => setLogoPreview(e.target.value || "/logo.png")}
                placeholder="https://exemplo.com/logo.png" 
                className={inputClass} 
              />
              <p className="text-xs text-muted-foreground">
                Cole o link da sua imagem ou deixe em branco para usar o padrão. (No futuro adicionaremos upload direto).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dados Principais */}
      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Building2 className="h-5 w-5 text-violet-500" />
            Dados da Empresa
          </h3>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="name" className="text-sm font-medium leading-none">Razão Social / Nome Fantasia <span className="text-red-500">*</span></label>
            <input id="name" name="name" defaultValue={config?.name} className={inputClass} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="cnpj" className="text-sm font-medium leading-none">CNPJ</label>
            <input id="cnpj" name="cnpj" defaultValue={config?.cnpj || ""} placeholder="00.000.000/0001-00" className={inputClass} />
          </div>
        </div>
      </div>

      {/* Contato e Endereço */}
      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
          <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Contact2 className="h-5 w-5 text-violet-500" />
            Contato & Endereço (Para o PDF)
          </h3>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="telefone" className="text-sm font-medium leading-none">Telefone / WhatsApp</label>
            <input id="telefone" name="telefone" defaultValue={config?.telefone || ""} placeholder="(00) 0000-0000" className={inputClass} />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">E-mail Comercial</label>
            <input id="email" name="email" defaultValue={config?.email || ""} type="email" placeholder="contato@empresa.com" className={inputClass} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="endereco" className="text-sm font-medium leading-none">Endereço Completo</label>
            <input id="endereco" name="endereco" defaultValue={config?.endereco || ""} placeholder="Rua das Flores, 123 - Centro - São Paulo/SP" className={inputClass} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-2 pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 h-10 px-8 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isPending ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>

    </form>
  )
}
