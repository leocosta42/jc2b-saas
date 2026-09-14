import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Domínios permitidos para CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'https://jc2b-saas.vercel.app',
  'https://jc2b.com.br',
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Adicionar headers CORS
  const origin = request.headers.get('origin') || ''
  if (ALLOWED_ORIGINS.includes(origin)) {
    supabaseResponse.headers.set('Access-Control-Allow-Origin', origin)
    supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
    supabaseResponse.headers.set('Access-Control-Allow-Credentials', 'true')
    supabaseResponse.headers.set('Access-Control-Max-Age', '86400')
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refresh the session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Rotas que não exigem login
  const publicRoutes = ['/login', '/esqueci-senha', '/redefinir-senha']

  // Verifica se a rota começa com /imprimir
  const isPublicDynamicRoute = path.startsWith('/imprimir/')

  // Se o usuário tentar acessar página privada e não estiver logado
  if (!user && !publicRoutes.includes(path) && !isPublicDynamicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se já estiver logado e tentar ir para login/recuperação
  if (user && publicRoutes.includes(path)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // CSP Header em modo ATIVO (bloqueia recursos não autorizados)
  supabaseResponse.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co https://*.supabaseapi.com wss://*.supabase.co wss://*.supabaseapi.com",
      "frame-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ].join('; ')
  )

  // Headers adicionais de segurança
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('X-Frame-Options', 'SAMEORIGIN')
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  return supabaseResponse
}
