"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard } from "lucide-react"

// Teste: por enquanto so o link de Dashboard fica na barra horizontal,
// o resto da navegacao acontece pelos cards da propria pagina inicial.
const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
]

export function TopNav({ isAdmin: _isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {LINKS.map((link) => {
        const Icon = link.icon
        const isActive = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-all ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
