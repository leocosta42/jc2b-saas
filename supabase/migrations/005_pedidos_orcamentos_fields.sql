-- Migration 005: Adicionar campos para suportar Orçamentos e espelhar o PDF

-- 1. Adicionar campos na tabela 'pedidos'
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'PEDIDO', -- 'ORCAMENTO' ou 'PEDIDO'
  ADD COLUMN IF NOT EXISTS data_emissao DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS data_entrega DATE,
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS desconto_total DECIMAL(12,2) DEFAULT 0;

-- 2. Adicionar campos na tabela 'itens_pedido'
ALTER TABLE itens_pedido
  ADD COLUMN IF NOT EXISTS desconto_percentual DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unidade_medida TEXT DEFAULT 'UN';

-- 3. Atualizar a fórmula de subtotal (para considerar o desconto)
-- Como a coluna era GENERATED ALWAYS, precisamos dropá-la e recriar
ALTER TABLE itens_pedido DROP COLUMN IF EXISTS subtotal;

ALTER TABLE itens_pedido 
  ADD COLUMN subtotal DECIMAL(12,2) 
  GENERATED ALWAYS AS (
    (quantidade * preco_unitario) * (1 - COALESCE(desconto_percentual, 0) / 100.0)
  ) STORED;
