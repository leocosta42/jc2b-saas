# CSP Monitoring Checklist

## 📋 Status Atual

✅ **CSP implementado em Report-Only Mode**
- Implementação: `src/lib/supabase/middleware.ts`
- Data: 2026-09-09
- Commit: `b24f6c1`
- Backup: `backup-before-csp`

---

## 🎯 O que Monitorar Esta Semana

### **Diariamente:**
- [ ] Abrir DevTools (F12) → Console
- [ ] Procurar por mensagens de CSP Report-Only
- [ ] Anotar quais recursos estão sendo bloqueados (se houver)
- [ ] Testar funcionalidades principais:
  - [ ] Login/Logout
  - [ ] Criação de pedidos/orçamentos
  - [ ] Export de PDFs
  - [ ] Upload de arquivos

### **Comportamento Normal:**
✅ Nenhuma mensagem de erro no console
✅ Todos os recursos carregam normalmente
✅ Aplicação funciona 100%

### **Sinais de Alerta:**
🔴 Mensagens tipo: `Refused to load script 'https://...' because it violates CSP`
🔴 Estilos não carregando
🔴 Fontes diferentes do esperado
🔴 PDFs não imprimindo

---

## 📝 Template para Anotações

Se encontrar algum bloqueio, anote:

```
Data: YYYY-MM-DD
Recurso: [URL ou tipo]
Mensagem: [erro exato do console]
Impacto: [alto/médio/baixo]
Solução: [adicionar ao CSP]
```

**Exemplo:**
```
Data: 2026-09-09
Recurso: https://cdn.jsdelivr.net/npm/chart.js
Mensagem: Refused to load the script because it violates CSP
Impacto: alto (gráficos não aparecem)
Solução: Adicionar https://cdn.jsdelivr.net ao script-src
```

---

## 🔧 Próximas Fases (Cuando Estiver Pronto)

### **Fase 5: CORS Explícito** (1 hora)
```
Status: ⏳ Agendado
Objetivo: Definir quais domínios podem acessar sua API
Arquivo: Novo middleware ou next.config.ts
```

### **Fase 6: .env.example** (30 minutos)
```
Status: ⏳ Agendado
Objetivo: Criar template de variáveis de ambiente
Arquivo: .env.example (novo)
```

---

## 🚀 Quando Passar para CSP Ativo

### **Critérios:**
- [ ] 1 semana sem erros no console
- [ ] Todas funcionalidades testadas
- [ ] Nenhum recurso bloqueado
- [ ] Documentação revisada

### **Passos:**
1. Fazer novo backup: `git tag backup-before-csp-active`
2. Editar `src/lib/supabase/middleware.ts`
3. Trocar `Content-Security-Policy-Report-Only` → `Content-Security-Policy`
4. Remover `'unsafe-inline'` e `'unsafe-eval'`
5. Testar em staging
6. Deploy gradual

---

## 🎯 Timeline Estimada

| Data | Atividade | Status |
|------|-----------|--------|
| 2026-09-09 | CSP Report-Only implementado | ✅ Feito |
| 2026-09-10 a 2026-09-16 | Monitoramento (1 semana) | 🔄 Em andamento |
| 2026-09-17 | Revisão de relatórios | ⏳ Agendado |
| 2026-09-18 | CSP Ativo (se tudo OK) | ⏳ Agendado |
| 2026-09-18 | CORS Explícito | ⏳ Agendado |
| 2026-09-18 | .env.example | ⏳ Agendado |

---

## 📞 Suporte Rápido

**Se algo quebrar:**
```bash
# Rollback imediato
git reset --hard backup-before-csp
```

**Se quiser ativar CSP:**
```bash
# Editar o arquivo
nano src/lib/supabase/middleware.ts

# Trocar a linha de:
'Content-Security-Policy-Report-Only'
# Para:
'Content-Security-Policy'
```

**Se quiser ver relatórios:**
```bash
# No DevTools:
F12 → Console → procurar por "Content-Security-Policy-Report-Only"
```

---

## 📊 Métricas Importantes

- **Recursos bloqueados**: 0 (esperado)
- **Erros CSP**: 0 (esperado)
- **Performance**: Sem mudanças esperadas
- **Segurança**: ↑ Aumentada (headers implementados)

---

**Status Final:** ✅ Pronto para monitoramento!
**Próximo Review:** 2026-09-16
