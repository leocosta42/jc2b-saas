-- Migration 012: Permitir peso total manual em pedidos/orçamentos
--
-- O campo "Peso Total (kg)" no formulário pode ser sobrescrito manualmente
-- (ex: quando um produto não tem peso cadastrado). Sem uma coluna própria,
-- a tela de impressão/PDF recalculava o peso a partir dos itens e ignorava
-- o valor manual digitado no formulário. Agora o valor efetivo (manual ou
-- calculado) é salvo junto com o documento e usado na impressão/PDF.

ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS peso_total DECIMAL(12,3);
