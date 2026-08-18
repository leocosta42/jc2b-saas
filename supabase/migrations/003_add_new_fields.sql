-- Adicionar campos de Código (Identificação) nas tabelas principais
ALTER TABLE clientes
ADD COLUMN codigo TEXT,
ADD COLUMN status TEXT DEFAULT 'Ativo';

ALTER TABLE vendedores
ADD COLUMN codigo TEXT,
ADD COLUMN status TEXT DEFAULT 'Ativo';

ALTER TABLE fornecedores
ADD COLUMN codigo TEXT,
ADD COLUMN status TEXT DEFAULT 'Ativo';

-- Atualizar Produtos
ALTER TABLE produtos
ADD COLUMN um TEXT DEFAULT 'UN',
ADD COLUMN status TEXT DEFAULT 'Ativo';

-- Atualizar Pedidos/Orçamentos
ALTER TABLE pedidos
ADD COLUMN tipo TEXT DEFAULT 'Pedido', -- 'Pedido' ou 'Orçamento'
ADD COLUMN data_entrega TIMESTAMPTZ,
ADD COLUMN comissao_percentual DECIMAL(5,2) DEFAULT 0,
ADD COLUMN comissao_rs DECIMAL(12,2) DEFAULT 0,
ADD COLUMN mes TEXT; -- Pode ser derivado da data de emissão, mas mantendo para compatibilidade com a planilha

-- Atualizar Itens do Pedido (Base Estatísticas)
ALTER TABLE itens_pedido
ADD COLUMN um TEXT DEFAULT 'UN',
ADD COLUMN valor_custo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN lucro_venda DECIMAL(12,2) GENERATED ALWAYS AS ((preco_unitario - valor_custo) * quantidade) STORED,
ADD COLUMN item_sequencia INTEGER; -- Numero do item no pedido (ex: Item 1, Item 2)
