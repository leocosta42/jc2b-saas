# RUNBOOK — Operação do JC2B SaaS

Guia de referência para quando algo der errado, ou para qualquer pessoa (você daqui a 6 meses, ou outro desenvolvedor) entender como o sistema roda. Cobre backup/recuperação, logs, monitoramento e documentação.

**Stack real deste projeto:**
- Frontend + backend: Next.js 16, hospedado no **Vercel** (deploy automático a cada push em `main` do GitHub `leocosta42/jc2b-saas`, repositório **público**)
- Banco de dados + Auth: **Supabase** (Postgres), projeto `tgttjjwjbsqizfsjzcrm`
- Sem monitoramento, alerta ou rastreamento de erros configurado hoje (verificado em 2026-08-31)

---

## 1. Backup — como recuperar

### Estado atual: automatizado e gratuito
Backup diário automático via GitHub Actions (`.github/workflows/backup.yml`), rodando todo dia às 03:00 (horário de Brasília). Ele roda `scripts/backup-db.mjs` (exporta todas as tabelas para JSON via `service_role` key) e envia o resultado para um **repositório GitHub privado separado**, nunca para o repositório público `jc2b-saas`.

**Configuração única (feita por você, uma vez):**
1. Criar um repositório **privado** vazio no GitHub chamado `jc2b-saas-backups` (github.com/new → marcar "Private"). Se preferir outro nome, ajuste a variável `BACKUP_REPO` no arquivo `.github/workflows/backup.yml`.
2. Gerar um **fine-grained personal access token** (github.com/settings/tokens → "Fine-grained tokens" → "Generate new token") com acesso restrito **somente** ao repositório `jc2b-saas-backups`, permissão "Contents: Read and write". Isso limita o dano se o token vazar algum dia — ele não teria acesso a nada além desse repositório de backup.
3. No repositório `jc2b-saas` (o público, da aplicação) → **Settings → Secrets and variables → Actions** → adicionar 3 *secrets*:
   - `BACKUP_REPO_TOKEN` — o token gerado no passo 2
   - `NEXT_PUBLIC_SUPABASE_URL` — mesmo valor do `.env.local`
   - `SUPABASE_SERVICE_ROLE_KEY` — mesmo valor do `.env.local`

Depois disso, o backup roda sozinho todo dia. Você pode testar na hora sem esperar: aba **Actions** do repositório → workflow "Backup diario do banco" → **Run workflow**.

### Restaurar a partir de um backup
Os dumps ficam em `jc2b-saas-backups/AAAA-MM-DD/<tabela>.json`. Restaurar não é automático (é JSON puro, não um dump SQL) — em caso de necessidade real, me chame que eu escrevo um script de restauração específico pro que aconteceu (perda total é diferente de "recuperar só a tabela de clientes", por exemplo).

### Retenção
O script não apaga backups antigos — o repositório privado vai crescer para sempre do jeito que está. Não é urgente (JSON comprime bem no Git, e o volume atual é pequeno), mas se quiser, no futuro posso adicionar uma rotina que mantém só os últimos 30 dias.

### Recuperação de deploy (não é banco, é o site no ar)
Se um deploy quebrar o site (ex: bug em produção), reverter é rápido e não mexe no banco:
1. No [painel do Vercel](https://vercel.com/dashboard) → projeto `jc2b-saas` → aba **Deployments**.
2. Ache o último deploy que funcionava (verde, "Ready").
3. Menu `...` → **Promote to Production**. Volta o site pro ar em segundos, sem precisar reverter código no GitHub.
4. Depois, corrija o problema com calma e faça um novo push.

---

## 2. Logs — como descobrir erros

### Onde olhar hoje

**Erros do backend (server actions, rotas, middleware):**
- Painel do Vercel → projeto → aba **Logs** (ou **Observability → Runtime Logs**). Mostra tudo que foi escrito com `console.log`/`console.error`/`console.warn` no servidor, em tempo real ou dos últimos deploys.
- No plano Hobby (gratuito), a retenção é curta (poucas horas/1 dia) — não dá pra investigar um erro de 3 dias atrás. Se isso for um problema recorrente, o plano Pro do Vercel estende a retenção.

**Erros do banco de dados / autenticação:**
- Painel do Supabase → **Logs** (menu lateral) → tem abas separadas: `Postgres Logs`, `Auth Logs`, `API Logs`. Útil para ver se uma query travou, se RLS bloqueou algo, ou se houve tentativas de login falhas.

**Erros do lado do cliente (navegador):**
- Hoje só aparecem no console do navegador de quem está usando — ninguém mais vê. Isso é o maior ponto cego: se um usuário tiver um erro de JavaScript, ninguém no time fica sabendo a menos que ele reclame.

### O código já loga o suficiente?
Sim, de forma básica — a maioria das `server actions` já tem `console.error("Erro ao...", error)` nos pontos certos. O problema não é a falta de log, é a falta de **retenção e de alerta automático** (você só descobre um erro se for procurar ativamente no painel).

### Recomendação: Sentry (plano gratuito)
Captura erros automaticamente (frontend e backend), agrupa por tipo, manda e-mail quando aparece um erro novo, e guarda histórico sem limite de tempo curto. O plano free cobre 5 mil eventos/mês, que é bastante folga pro volume desse sistema.

Isso exigiria eu adicionar a dependência `@sentry/nextjs` e configurar — é uma mudança de código, então só faço se você topar (tem um passo de criar conta em sentry.io que só você pode fazer).

---

## 3. Monitoramento — como saber que caiu

### Estado atual
Nenhum. Se o site cair (erro 500 generalizado, Supabase fora do ar, domínio expirado, etc.), **ninguém é avisado** — você só descobre se alguém tentar acessar e reclamar, ou se você mesmo checar.

### Recomendação: monitor de uptime gratuito
Serviços como **UptimeRobot** (gratuito até 50 monitores, checagem a cada 5 min) ou **Better Uptime** (free tier menor):
1. Criar conta em uptimerobot.com.
2. Adicionar um monitor HTTP(S) apontando para `https://jc2b-saas.vercel.app/login` (essa rota sempre responde 200 se o site está de pé, mesmo sem estar logado).
3. Configurar alerta por e-mail (ou WhatsApp/Telegram, o UptimeRobot free tem integração) para quando ficar fora do ar.

Isso é 100% configuração de conta externa — não depende de mudar código, é só você (ou eu te guio passo a passo se preferir).

### Bônus: alerta de deploy quebrado
O Vercel já pode te avisar sozinho quando um deploy falha (não quando o site cai depois de já estar no ar, mas quando um push quebra o build):
- Painel do Vercel → projeto → **Settings → Notifications** → ativar e-mail (ou Slack/Discord) para "Deployment Failed". Isso é gratuito e leva 1 minuto pra configurar.

---

## 4. Documentação — como entender depois

### O que já existe e onde
- **`CLAUDE.md`** (raiz do projeto) — visão geral do sistema, stack, estrutura de pastas, tabelas do banco, convenções de código. Ponto de partida pra qualquer pessoa (ou IA) nova no projeto.
- **`AGENTS.md`** — instruções específicas sobre o Next.js usado (gerado automaticamente).
- **`supabase/migrations/`** — histórico completo e comentado de toda mudança de schema do banco, em ordem cronológica. Cada migração recente (007 em diante) tem comentário explicando **por que** a mudança foi feita, não só o quê.
- **`claude/`** — análises e planos de melhoria escritos ao longo do desenvolvimento (UX, segurança, roadmap). Histórico de decisões, não documentação de referência viva.
- **Este arquivo (`RUNBOOK.md`)** — operação (backup, logs, monitoramento).

### O que falta
- **Nenhum diagrama ou descrição do fluxo de dados** (ex: o que acontece quando um pedido é aprovado — quais tabelas mudam, em que ordem). Hoje isso só está no código (`src/app/actions/vendas.ts`).
- **Nenhuma lista de variáveis de ambiente com explicação** de onde conseguir cada uma (parcialmente coberto no `CLAUDE.md`, mas sem instruções de "onde no painel do Supabase pegar isso").
- **Nenhum guia de "como fazer deploy pela primeira vez"** caso precise recriar o ambiente do zero (novo projeto Supabase, rodar todas as migrações em ordem, configurar Vercel).

Se quiser, posso criar um `docs/ARQUITETURA.md` cobrindo os fluxos principais (pedido, orçamento→pedido, ajuste de estoque) com diagramas simples em texto, e um `docs/SETUP_DO_ZERO.md` com o passo a passo de recriar o ambiente. Não fiz isso agora pra não assumir que é isso que você quer — me avise.

---

## Resumo — plano 100% gratuito

| Item | Ação | Status |
|---|---|---|
| Backup do banco | GitHub Action diária + repo privado (`scripts/backup-db.mjs`) | ✅ Código pronto — falta você criar o repo privado e os 3 secrets (passo a passo acima) |
| Rollback de deploy | "Promote to Production" no Vercel | ✅ Já disponível, não precisa configurar nada |
| Logs de erro | Vercel Runtime Logs + Supabase Logs | ✅ Já disponível, retenção curta no plano gratuito |
| Rastreamento de erro (Sentry) | Fora do plano por enquanto (free tier existe, mas fica pra depois) | ⏸️ Adiado |
| Monitor de uptime | Conta grátis no UptimeRobot | ⬜ Pendente — você cria a conta (2 min), me chama se quiser que eu guie passo a passo |
| Alerta de deploy quebrado | Ativar notificação no Vercel (Settings → Notifications) | ⬜ Pendente — 1 clique seu |
| Documentação de arquitetura | `docs/ARQUITETURA.md` e `docs/SETUP_DO_ZERO.md` | ⬜ Pendente — aviso se quiser que eu escreva agora |
