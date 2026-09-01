"use client"

import { useState } from "react"
import { Printer, FileDown, MessageCircle, X, Loader2 } from "lucide-react"

interface PrintActionsProps {
  id: string
  numero: string
  tipo: string
  celular?: string
}

export function PrintActions({ id, numero, tipo, celular }: PrintActionsProps) {
  const [gerandoPdf, setGerandoPdf] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleGerarPdf = async () => {
    setGerandoPdf(true)
    try {
      const res = await fetch(`/imprimir/${id}/pdf`)
      if (!res.ok) throw new Error('Falha ao gerar o PDF.')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tipo === 'Orçamento' ? 'orcamento' : 'pedido'}-${numero}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      alert('Não foi possível gerar o PDF. Tente novamente.')
    } finally {
      setGerandoPdf(false)
    }
  }

  const handleClose = () => {
    window.close()
  }

  const handleWhatsApp = () => {
    const url = `${window.location.origin}/imprimir/${id}`
    const text = `Olá! Segue o link do seu ${tipo} nº ${numero}:\n\n${url}`
    
    let num = celular?.replace(/\D/g, '') || ''
    if (num && num.length >= 10 && !num.startsWith('55')) {
      num = '55' + num
    }

    const waUrl = num ? `https://wa.me/${num}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(waUrl, '_blank')
  }

  return (
    <div className="max-w-[800px] mx-auto mb-4 print:hidden flex justify-end gap-2">
      <button 
        onClick={handleWhatsApp}
        className="flex items-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded shadow hover:bg-[#128C7E] transition-colors font-medium"
      >
        <MessageCircle className="h-4 w-4" />
        Enviar WhatsApp
      </button>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition-colors font-medium"
      >
        <Printer className="h-4 w-4" />
        Imprimir
      </button>
      <button
        onClick={handleGerarPdf}
        disabled={gerandoPdf}
        className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded shadow hover:bg-rose-700 transition-colors font-medium disabled:opacity-50"
      >
        {gerandoPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
        {gerandoPdf ? "Gerando..." : "Gerar PDF"}
      </button>
      <button 
        onClick={handleClose}
        className="flex items-center gap-2 bg-gray-300 text-black px-4 py-2 rounded shadow hover:bg-gray-400 transition-colors font-medium"
      >
        <X className="h-4 w-4" />
        Fechar
      </button>
    </div>
  )
}
