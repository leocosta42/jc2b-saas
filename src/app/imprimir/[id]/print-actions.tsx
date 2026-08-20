"use client"

import { Printer, MessageCircle, X } from "lucide-react"

interface PrintActionsProps {
  id: string
  numero: string
  tipo: string
  celular?: string
}

export function PrintActions({ id, numero, tipo, celular }: PrintActionsProps) {
  const handlePrint = () => {
    window.print()
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
        Imprimir / PDF
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
