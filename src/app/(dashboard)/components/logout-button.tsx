"use client"

import { LogOut } from "lucide-react"
import { signOut } from "@/app/actions/auth"
import { useState } from "react"

export function LogoutButton() {
  const [isPending, setIsPending] = useState(false)

  const handleLogout = async () => {
    setIsPending(true)
    await signOut()
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
