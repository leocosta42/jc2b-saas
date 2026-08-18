import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package } from 'lucide-react'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ message?: string, mode?: string }> }) {
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    return redirect('/')
  }

  const resolvedParams = await searchParams;
  const isRegister = resolvedParams?.mode === 'register'
  const message = resolvedParams?.message

  const authenticate = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const mode = formData.get('mode') as string
    const name = formData.get('name') as string
    
    const supabase = await createClient()
    
    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      })
      if (error) return redirect(`/login?mode=register&message=${error.message}`)
      return redirect('/login?message=Conta criada com sucesso! Você já pode fazer login.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return redirect('/login?message=Credenciais inválidas.')
      return redirect('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md w-full space-y-8 bg-background p-10 rounded-2xl shadow-xl border border-border/50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <Package className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            {isRegister ? 'Cadastrar Vendedor' : 'Entrar no JC2B'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isRegister 
              ? 'Cadastre o acesso de um novo vendedor do time' 
              : 'Acesse o painel do sistema JC2B'}
          </p>
        </div>

        {message && (
          <div className="p-3 bg-muted text-foreground text-center text-sm rounded-lg border border-border">
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" action={authenticate}>
          <input type="hidden" name="mode" value={isRegister ? 'register' : 'login'} />
          
          <div className="space-y-4 rounded-md shadow-sm">
            {isRegister && (
              <div>
                <label className="sr-only">Nome Completo</label>
                <input name="name" type="text" required className="relative block w-full rounded-md border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background" placeholder="Seu nome completo" />
              </div>
            )}
            <div>
              <label className="sr-only">E-mail</label>
              <input name="email" type="email" required className="relative block w-full rounded-md border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background" placeholder="Email corporativo" />
            </div>
            <div>
              <label className="sr-only">Senha</label>
              <input name="password" type="password" required className="relative block w-full rounded-md border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background" placeholder="Senha" />
            </div>
          </div>

          <div>
            <button type="submit" className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all">
              {isRegister ? 'Cadastrar Vendedor' : 'Entrar no Sistema'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          {isRegister ? (
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Já possui uma conta? Faça login
            </Link>
          ) : (
            <Link href="/login?mode=register" className="font-medium text-primary hover:text-primary/80">
              Cadastrar acesso de um novo vendedor
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
