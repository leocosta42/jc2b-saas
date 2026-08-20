"use client"

import { useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"

interface ConfirmModalProps {
  title: string
  description: string
  onConfirm: () => Promise<void> | void
  trigger: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: "danger" | "success" | "warning"
}

export function ConfirmModal({ 
  title, 
  description, 
  onConfirm, 
  trigger, 
  confirmText = "Confirmar", 
  cancelText = "Cancelar",
  variant = "danger"
}: ConfirmModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsPending(true)
    await onConfirm()
    setIsPending(false)
    setIsOpen(false)
  }

  const colorMap = {
    danger: "bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white",
    success: "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 text-white"
  }
  
  const iconColorMap = {
    danger: "text-red-500 bg-red-500/10 border-red-500/20",
    success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    warning: "text-amber-500 bg-amber-500/10 border-amber-500/20"
  }

  return (
    <>
      <div onClick={(e) => { e.stopPropagation(); setIsOpen(true) }} className="inline-block">
        {trigger}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm transition-all duration-200">
          <div 
            className="fixed inset-0" 
            onClick={(e) => { e.stopPropagation(); !isPending && setIsOpen(false) }}
          ></div>
          <div className="relative w-full max-w-md p-6 bg-card border border-border shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex gap-4 items-start">
              <div className={`p-3 rounded-2xl shrink-0 border ${iconColorMap[variant]}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="pt-1">
                <h3 className="text-lg font-bold leading-none tracking-tight mb-2.5 text-foreground">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsOpen(false) }}
                disabled={isPending}
                className="px-4 py-2.5 text-sm font-semibold rounded-xl text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className={`px-4 py-2.5 text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 ${colorMap[variant]}`}
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
