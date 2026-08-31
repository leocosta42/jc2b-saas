# RUNBOOK — Operação do JC2B SaaS

Guia de referência para quando algo der errado, ou para qualquer pessoa (você daqui a 6 meses, ou outro desenvolvedor) entender como o sistema roda. Cobre backup/recuperação, logs, monitoramento e documentação.

**Stack real deste projeto:**
- Frontend + backend: Next.js 16, hospedado no **Vercel** (deploy automático a cada push em `main` do GitHub `leocosta42/jc2b-saas`, repositório **público**)
- Banco de dados + Auth: **Supabase** (Postgres), projeto `tgttjjwjbsqizfsjzcrm`
- Sem monitoramento, alerta ou rastreamento de erros configurado hoje (verificado em 2026-08-31)

---

## 1. Backup — como recuperar

### Estado atual
Não há nenhum backup automático configurado hoje. Se o banco for corrompido ou dados forem apagados por engano, **não há como recuperar** a não ser que você tenha feito algo manualmente.

### Recomendação principal: ativar backup do Supabase
É de longe a opção mais simples e confiável — o Supabase já sabe fazer isso corretamente (backup consistente, sem risco de vazar dados).

1. No [painel do Supabase](https://supabase.com/dashboard/project/tgttjjwjbsqizfsjzcrm) → **Settings → Database → Backups**.
2. **Plano Free**: sem backups automáticos garantidos (o Supabase pode reter algo por pouco tempo, mas não é uma garantia contratual — não confie nisso).
3. **Plano Pro (US$25/mês)**: backups diários automáticos com 7 dias de retenção, incluídos. Point-in-time Recovery (restaurar para qualquer segundo dos últimos dias) é um add-on pago à parte, mas o backup diário já cobre "recuperar de ontem".
4. Restauração: pelo próprio painel (Backups → Restore), sem precisar de comando nenhum. O Supabase avisa antes de sobrescrever.

**Dado que este banco já tem dados reais de clientes (CPF/CNPJ, endereço, contato) e é usado em produção, recomendo fortemente o plano Pro só por causa do backup — os R$130/mês são baratos perto do risco de perder a base de clientes/pedidos sem chance de recuperação.**

### Alternativa gratuita (DIY) — se não quiser pagar agora
Um script que exporta todas as tabelas para arquivos JSON usando a `service_role` key. Está em `scripts/backup-db.mjs` (criado nesta sessão — veja abaixo).

⚠️ **Importante**: rode esse script e guarde o resultado em um lugar **privado** — nunca no repositório público `jc2b-saas` (viraria um vazamento de dados de cliente). Opções seguras: seu computador local, um bucket privado (S3/R2/Google Drive privado), ou um repositório GitHub **privado** separado.

Como rodar manualmente:
```bash
node scripts/backup-db.mjs
# gera uma pasta backups/AAAA-MM-DD/ com um .json por tabela
```

Para automatizar (ex: 1x por dia), a forma mais simples sem gastar nada é rodar esse script localmente via Agendador de Tarefas do Windows, apontando pra uma pasta fora do repositório. Automatizar via GitHub Actions exigiria um repositório privado separado só para os backups — me avise se quiser que eu monte isso.

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

## Resumo — o que decidir

| Item | Ação | Custo | Quem decide |
|---|---|---|---|
| Backup do banco | Ativar Supabase Pro (recomendado) ou usar o script DIY | ~R$130/mês ou grátis (com mais esforço manual) | Você |
| Retenção de logs | Manter Vercel Hobby ou upgrade pra Pro | Grátis ou ~R$100/mês | Você |
| Rastreamento de erro | Adicionar Sentry (free tier) | Grátis, exige mudança de código | Você aprova, eu implemento |
| Monitor de uptime | Criar conta UptimeRobot | Grátis | Você (ou eu guio) |
| Alerta de deploy quebrado | Ativar notificação no Vercel | Grátis | Você (1 clique) |
| Documentação de arquitetura | Criar `docs/ARQUITETURA.md` | Grátis, meu tempo | Você aprova, eu escrevo |
