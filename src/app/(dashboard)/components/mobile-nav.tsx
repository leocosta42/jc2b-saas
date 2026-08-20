"use client"

import Image from "next/image"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LayoutDashboard, FileSpreadsheet, Briefcase, Contact, Truck, Boxes, LineChart, SlidersHorizontal } from "lucide-react"

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/orcamentos", label: "Vendas / Orçamentos", icon: FileSpreadsheet },
    { href: "/vendedores", label: "Vendedores", icon: Briefcase },
    { href: "/clientes", label: "Clientes", icon: Contact },
    { href: "/fornecedores", label: "Fornecedores", icon: Truck },
    { href: "/estoque", label: "Estoque", icon: Boxes },
    { href: "/estatisticas", label: "Estatísticas", icon: LineChart },
    { href: "/configuracoes", label: "Configurações", icon: SlidersHorizontal },
  ]

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <div className="relative flex w-full max-w-xs flex-col overflow-y-auto bg-background p-6 shadow-xl h-full animate-in slide-in-from-left-full duration-200">
            <div className="flex items-center justify-between mb-8 bg-white p-2 rounded-md">
              <Image src="/logo.png" alt="JC2B Parts" width={140} height={40} className="object-contain" />
              <button 
                onClick={() => setIsOpen(false)} 
                className="rounded-md p-2 text-muted-foreground hover:bg-muted"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <nav className="flex-1 space-y-2">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href))
                
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all ${
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
