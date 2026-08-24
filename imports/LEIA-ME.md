# 📥 Instruções de Importação de Dados

## 1. Pré-requisitos

Antes de executar o script, você precisa da chave `service_role` do Supabase:

1. Acesse https://supabase.com → Seu projeto
2. Vá em **Settings > API**
3. Copie a chave em **"service_role"** (começa com `eyJ...`)
4. Cole no arquivo `import-data.mjs` na linha que diz `SUPABASE_SERVICE_KEY = "COLE_SUA_CHAVE_AQUI"`

## 2. Exportar as abas como CSV

No Google Sheets / Excel, para cada aba:
- `Arquivo > Fazer Download > Valores separados por vírgula (.csv)`

Salve os arquivos **nesta mesma pasta `imports/`** com os nomes exatos:

| Aba          | Nome do arquivo a salvar  |
|--------------|---------------------------|
| Vendedores   | `vendedores.csv`          |
| Fornecedores | `fornecedores.csv`        |
| Clientes     | `clientes.csv`            |
| Produtos     | `produtos.csv`            |
| Pedidos      | `pedidos.csv`             |

## 3. Executar o script

No terminal, dentro da pasta `saas-project`, execute:

```bash
node import-data.mjs
```

## 4. Verificar os logs

O script vai exibir no terminal o progresso de cada importação.
Ao final, mostra um resumo de sucesso e erros (se houver).

## ⚠️ Atenção

- **Execute apenas uma vez!** O script não verifica duplicatas automaticamente
- A ordem de importação é automática: Vendedores → Fornecedores → Clientes → Produtos → Pedidos
- Pedidos sem clientes/vendedores correspondentes serão pulados com aviso

---

## 📦 Parte 2 — Importar os Itens dos Pedidos (import-items.mjs)

Cada aba da planilha é um pedido/orçamento. Este script lê o arquivo Excel completo e importa os itens vinculando ao pedido e produto correto.

**Pré-requisito:** já ter executado o `import-data.mjs` antes!

### Como usar:

1. Copie o arquivo Excel completo (`.xlsx`) para a pasta `imports/`
2. Renomeie-o para `planilha.xlsx` (ou altere o nome do arquivo no script — variável `EXCEL_FILE`)
3. Certifique-se de que a `SUPABASE_SERVICE_KEY` está configurada no `import-items.mjs`
4. Execute:

```bash
node import-items.mjs
```

### O que o script faz automaticamente:
- Detecta todas as abas numéricas (ignora "Formulário Pedido" e similares)
- Para cada aba, lê os itens: Código, Qtde, UM, Valor Uni, Desc %
- Vincula cada item ao pedido correspondente pelo número da aba
- Vincula cada produto pelo SKU (código do produto)
- Exibe um resumo final com total de itens importados e erros
