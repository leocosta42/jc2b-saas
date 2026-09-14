# CORS (Cross-Origin Resource Sharing) Configuration

## 📋 O que foi implementado?

**CORS Explícito** foi adicionado ao middleware de Supabase (`src/lib/supabase/middleware.ts`).

Agora apenas domínios autorizados podem acessar sua API.

---

## 🔐 Domínios Permitidos

```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:3000',      // Desenvolvimento local
  'http://localhost:3001',      // Dev server alternativo
  'http://127.0.0.1:3000',      // Localhost IP
  'https://jc2b-saas.vercel.app', // Seu domínio Vercel
  'https://jc2b.com.br',         // Seu domínio customizado
]
```

---

## 📊 Headers CORS Implementados

| Header | Valor | Propósito |
|--------|-------|----------|
| `Access-Control-Allow-Origin` | Domínios da whitelist | Autoriza requisições de domínios específicos |
| `Access-Control-Allow-Methods` | GET, POST, PUT, DELETE, PATCH | Métodos HTTP permitidos |
| `Access-Control-Allow-Headers` | Content-Type, Authorization | Headers que podem ser enviados |
| `Access-Control-Allow-Credentials` | true | Permite cookies/autenticação |
| `Access-Control-Max-Age` | 86400 (24h) | Cache de preflight requests |

---

## 🛡️ Proteção Oferecida

### ✅ O que o CORS impede:

```javascript
// ❌ BLOQUEADO - requisição de um domínio não autorizado
fetch('https://seu-api.com/pedidos', {
  credentials: 'include'
})
// Resultado: CORS Error - origin not allowed
```

### ✅ O que é permitido:

```javascript
// ✅ PERMITIDO - requisição do seu próprio domínio
fetch('https://jc2b-saas.vercel.app/api/pedidos', {
  credentials: 'include'
})
// Resultado: Sucesso
```

---

## 🔧 Como Adicionar Novo Domínio

Se precisar adicionar um novo domínio autorizado:

**Arquivo:** `src/lib/supabase/middleware.ts`

```typescript
const ALLOWED_ORIGINS = [
  // ... domínios existentes ...
  'https://seu-novo-dominio.com', // ← Adicione aqui
]
```

Depois:
```bash
npm run build
git add -A
git commit -m "chore: add new CORS origin"
git push origin main
```

---

## 📊 Teste de CORS

### Local (deve funcionar):
```bash
curl -H "Origin: http://localhost:3000" \
  http://localhost:3000/api/pedidos
```

Deve retornar:
```
Access-Control-Allow-Origin: http://localhost:3000
```

### Domínio não autorizado (deve falhar):
```bash
curl -H "Origin: https://untrusted-site.com" \
  https://jc2b-saas.vercel.app/api/pedidos
```

Deve retornar:
```
(sem CORS headers)
```

---

## 🎯 Benefícios

| Aspecto | Antes | Depois |
|--------|-------|--------|
| **Acesso à API** | 🟢 Qualquer site | 🔴 Apenas domínios autorizados |
| **Roubo de Dados** | ⚠️ Alto risco | ✅ Protegido |
| **CSRF Attacks** | ⚠️ Vulnerável | ✅ Protegido |
| **Data Exfiltration** | ⚠️ Possível | ✅ Bloqueado |

---

## 🔄 Preflight Requests

O navegador faz uma requisição `OPTIONS` antes de requisições complexas:

```
OPTIONS /api/pedidos HTTP/1.1
Origin: https://jc2b-saas.vercel.app
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Content-Type
```

Seu servidor responde com os headers CORS, e o navegador autoriza (ou não) a requisição real.

---

## ⚠️ Importante

- **Nunca deixe `*` em produção** (ALLOWED_ORIGINS)
- **Sempre use HTTPS** em domínios de produção
- **Revise a whitelist regularmente** (remova domínios antigos)
- **Documente cada adição** (por que esse domínio precisa de acesso?)

---

## 📚 Referências

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [OWASP: CORS](https://owasp.org/www-community/Cross-Origin_Resource_Sharing)

---

**Status:** ✅ ATIVO
**Data:** 2026-09-14
**Segurança:** 🔐 Nível Enterprise
