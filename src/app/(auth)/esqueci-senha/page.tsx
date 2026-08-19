import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { KeyRound, ArrowLeft } from 'lucide-react'

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ message?: string, error?: string }> }) {
  const resolvedParams = await searchParams;
  const message = resolvedParams?.message;
  const errorMsg = resolvedParams?.error;

  const sendResetLink = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    
    if (!email) return redirect('/esqueci-senha?error=O email é obrigatório.')

    const supabase = await createClient()
    
    // Configura a URL de redirecionamento para onde o usuário será enviado após clicar no link do email
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/redefinir-senha`,
    })

    if (error) {
      return redirect(`/esqueci-senha?error=${error.message}`)
    }
    
    return redirect('/esqueci-senha?message=Email de recuperação enviado! Verifique sua caixa de entrada e pasta de spam.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="max-w-md w-full space-y-8 bg-background p-10 rounded-2xl shadow-xl border border-border/50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Recuperar Senha
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Digite o seu email corporativo para receber um link de redefinição de senha.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 text-red-500 text-center text-sm rounded-lg border border-red-500/20">
            {errorMsg}
          </div>
        )}

        {message && (
          <div className="p-3 bg-emerald-500/10 text-emerald-500 text-center text-sm rounded-lg border border-emerald-500/20">
            {message}
          </div>
        )}

        <form className="mt-8 space-y-6" action={sendResetLink}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="sr-only">E-mail</label>
              <input name="email" type="email" required className="relative block w-full rounded-md border-0 py-2.5 px-3 text-foreground ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:z-10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 bg-background" placeholder="Email corporativo" />
            </div>
          </div>

          <div>
            <button type="submit" className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all">
              Enviar Link de Recuperação
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="font-medium text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  )
}
