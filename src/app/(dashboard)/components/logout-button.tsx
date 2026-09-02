"use client"

import { LogOut } from "lucide-react"
import { signOut } from "@/app/actions/auth"
import { useState } from "react"

export function LogoutButton({ compact }: { compact?: boolean }) {
  const [isPending, setIsPending] = useState(false)

  const handleLogout = async () => {
    setIsPending(true)
    await signOut()
  }

  if (compact) {
    return (
      <button
        onClick={handleLogout}
        disabled={isPending}
        title="Sair"
        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all disabled:opacity-50"
      >
        <LogOut className={`h-4 w-4 ${isPending ? "animate-pulse" : ""}`} />
        <span className="hidden lg:inline">{isPending ? "Saindo..." : "Sair"}</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all disabled:opacity-50"
    >
      <LogOut className={`h-5 w-5 ${isPending ? "animate-pulse" : ""}`} />
      {isPending ? "Saindo..." : "Sair"}
    </button>
  )
}
