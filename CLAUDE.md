# SAAS-PROJECT - ERP SaaS

## O Que É
Sistema ERP SaaS para gestão completa de vendas e operações. Gerencia cadastros, estoque, vendas e orçamentos.

## Funcionalidades Principais
- **Cadastros**: Produtos, Clientes, Fornecedores, Vendedores
- **Controle de Estoque**: Gerenciar quantidade e movimentações
- **Pedidos de Vendas**: Criar, editar e acompanhar pedidos
- **Orçamentos**: Gerar e converter orçamentos em pedidos
- **Relatórios**: Análises de vendas e estoque

## Stack
- **Frontend**: Next.js (App Router)
- **Backend**: Node.js com Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Integração**: XLSX para importação/exportação de dados
- **IA**: Agents (veja AGENTS.md)

## Estrutura de Pastas
```
saas-project/
├── .next/              - Build Next.js (não editar)
├── claude/             - Configurações Claude Code
├── node_modules/       - Dependências (não commitar)
├── public/             - Arquivos estáticos
├── src/                - Código fonte principal
│   ├── app/           - Rotas e páginas Next.js
│   ├── components/    - Componentes React reutilizáveis
│   ├── lib/          - Funções auxiliares
│   ├── types/        - Tipos TypeScript
│   └── utils/        - Utilitários
├── supabase/          - Migrações e configuração Supabase
├── xlsm_extracted/    - Dados extraídos de Excel
├── .env.local         - Variáveis de ambiente (não commitar)
├── AGENTS.md          - Documentação de Agents
├── CLAUDE.md          - Este arquivo
├── package.json       - Dependências NPM
└── tsconfig.json      - Configuração TypeScript
```

## Tabelas Principais do Supabase
- `produtos` - Catálogo de produtos
- `clientes` - Dados de clientes
- `fornecedores` - Dados de fornecedores
- `vendedores` - Dados de vendedores
- `estoque` - Controle de quantidade
- `pedidos_vendas` - Pedidos registrados
- `itens_pedido` - Itens dentro de cada pedido
- `orcamentos` - Orçamentos gerados

## Convenções de Código
- **Componentes React**: PascalCase (ex: `CadastroProduto.tsx`)
- **Funções/Variáveis**: camelCase (ex: `calcularTotal()`)
- **Pastas**: lowercase com hífen (ex: `/api/produtos`)
- **Tipos TypeScript**: Definir em `/src/types/`
- **Componentes reutilizáveis**: Colocar em `/src/components/`

## Fluxos Principais

### Criar Pedido de Venda
1. Selecionar cliente existente ou criar novo
2. Adicionar produtos do estoque
3. Definir quantidades
4. Calcular total (desconto se aplicável)
5. Salvar no banco de dados
6. Gerar número do pedido

### Gerar Orçamento
1. Similar ao pedido, mas com status "orçamento"
2. Pode ser convertido em pedido após aprovação

### Controlar Estoque
1. Registrar entrada de fornecedor
2. Registrar saída por pedido
3. Manter saldo atualizado
4. Alertar quando estoque baixo

## Antes de Fazer Mudanças
- ⚠️ **Não altere** estrutura de tabelas Supabase sem avisar
- ⚠️ **Não delete** migrações antigas em `/supabase`
- ✅ Sempre crie migrações novas para mudanças no schema
- ✅ Teste localmente antes de fazer commit
- ✅ Leia AGENTS.md se mexer com IA/automações

## Como Rodar
```bash
# Instalar dependências
npm install

# Variáveis de ambiente (copie de alguém ou configure)
# Edite .env.local com credenciais Supabase

# Rodar em desenvolvimento
npm run dev

# Acessa em http://localhost:3000
```

## Variáveis de Ambiente Necessárias
```
NEXT_PUBLIC_SUPABASE_URL=seu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
SUPABASE_SERVICE_ROLE_KEY=sua_key
```

## Imports Comuns
```typescript
// Supabase
import { createClient } from '@supabase/supabase-js'

// Tipos customizados
import type { Produto, Cliente, Pedido } from '@/types'

// Componentes
import { Button, Input, Card } from '@/components'
```

## Dicas para Claude Code
- Ao criar novas funcionalidades, atualize as tabelas Supabase com migrações
- Mantenha tipos TypeScript sincronizados com schema do banco
- Use componentes reutilizáveis quando possível
- Sempre que adicionar endpoints API, documente em comentários
