# Content Security Policy (CSP) Setup

## 📋 O que foi implementado?

Foi criado um **middleware Next.js** (`src/middleware.ts`) que adiciona headers de segurança ao projeto:

### Headers Implementados:

1. **Content-Security-Policy-Report-Only** (CSP em modo relatório)
   - Não bloqueia nada, apenas registra violações
   - Você pode monitorar console do navegador
   - Eventualmente converter para modo ativo

2. **X-Content-Type-Options: nosniff**
   - Impede MIME-type sniffing (proteção XSS)

3. **X-Frame-Options: SAMEORIGIN**
   - Impede clickjacking
   - Seu app só pode ser embutido em iframes do próprio domínio

4. **X-XSS-Protection: 1; mode=block**
   - Proteção contra XSS em navegadores legados

5. **Referrer-Policy: strict-origin-when-cross-origin**
   - Controla dados de referência enviados

6. **Permissions-Policy**
   - Bloqueia acesso a geolocation, microfone, câmera

---

## 🔍 Como Monitorar Violações de CSP

### Opção 1: Console do Navegador (Mais fácil)

1. Abra seu app: `http://localhost:3000`
2. Pressione `F12` (DevTools)
3. Vá na aba **Console**
4. Procure por mensagens tipo:
   ```
   Refused to load the script 'https://...' because it violates the 
   Content-Security-Policy-Report-Only directive
   ```

### Opção 2: Network Inspector

1. DevTools → aba **Network**
2. Recarregue a página
3. Veja os requests sendo bloqueados/alertados

### Opção 3: CSP Reports Endpoint (Avançado)

Se quiser coletar relatórios de CSP automaticamente, adicione:

```typescript
// src/middleware.ts
"report-uri https://seu-dominio.com/api/csp-reports"
```

---

## 🎯 CSP Explicado (Simples)

```
default-src 'self'              → Padrão: apenas recursos próprios
script-src 'self' 'unsafe-eval' → Scripts: próprios + permite eval()
style-src 'self' https://...    → Estilos: próprios + Google Fonts
font-src 'self' https://...     → Fontes: próprios + Google Fonts
img-src 'self' data: https:     → Imagens: próprias + data URIs + https
connect-src 'self' https://...  → XHR/Fetch: próprio + Supabase
```

---

## 📊 Passo a Passo: Report-Only → Ativo

### **Semana 1: Monitoramento**
- Deixar em `Content-Security-Policy-Report-Only` 
- Monitorar console para violações
- Documentar quais recursos estão sendo bloqueados

### **Semana 2: Ajustes**
- Baseado nos relatórios, ajustar o CSP
- Adicionar domínios/recursos que estão sendo bloqueados
- Remover `'unsafe-inline'` e `'unsafe-eval'` gradualmente

### **Semana 3: Produção**
- Trocar de `Content-Security-Policy-Report-Only` para `Content-Security-Policy`
- Testar em ambiente de staging
- Monitorar por 24-48h antes de manter

---

## ⚙️ Configuração Futura (CSP Ativo)

Quando estiver pronto para ativar o CSP real, faça no `src/middleware.ts`:

```typescript
// Mudar de:
'Content-Security-Policy-Report-Only'

// Para:
'Content-Security-Policy'
```

**E remova:**
```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
```

**Use instead:**
```typescript
"script-src 'self' https://trusted-cdn.com",
```

---

## 🚨 Rollback Rápido

Se algo quebrar:

```bash
# Voltar ao backup
git reset --hard backup-before-csp

# Ou remover o middleware
rm src/middleware.ts
```

---

## ✅ Checklist

- [x] Middleware criado em `src/middleware.ts`
- [x] CSP em report-only mode (seguro)
- [x] Headers adicionais implementados
- [ ] Monitorar console por 1 semana
- [ ] Ajustar baseado em relatórios
- [ ] Converter para CSP ativo (depois)

---

## 📚 Recursos

- [MDN: CSP](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Headers/Content-Security-Policy)
- [CSP Tester Online](https://csp-evaluator.withgoogle.com/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
