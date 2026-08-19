import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Lock } from 'lucide-react'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string, error?: string }> }) {
  const resolvedParams = await searchParams;
  const errorMsg = resolvedParams?.error;

  const updatePassword = async (formData: FormData) => {
    'use server'
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    if (!password || password.length < 6) {
      return redirect('/redefinir-senha?error=A senha deve ter pelo menos 6 caracteres.')
    }
    
    if (password !== confirmPassword) {
      return redirect('/redefinir-senha?error=As senhas não coincidem.')
    }

    const supabase = await createClient()
    
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      return redirect(`/redefinir-senha?error=${error.message}`)
    }
    
    return redirect('/login?message=Senha redefinida com sucesso! Você já pode fazer login.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md w-full space-y-8 bg-background p-10 rounded-2xl shadow-xl border border-border/50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Criar Nova Senha
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Digite sua nova senha abaixo para acessar a sua conta.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 text-red-500 text-center text-sm rounded-lg border border-red-500/20">
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" action={updatePassword}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="sr-only">Nova Senha</label>
              <input name="password" type="password" required minLength={6} className="relative block w-full rounded-md border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background" placeholder="Nova Senha (min. 6 caracteres)" />
            </div>
            <div>
              <label className="sr-only">Confirmar Nova Senha</label>
              <input name="confirmPassword" type="password" required minLength={6} className="relative block w-full rounded-md border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background" placeholder="Confirmar Nova Senha" />
            </div>
          </div>

          <div>
            <button type="submit" className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all">
              Redefinir Senha
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
