-- Migration 020: Adicionar coluna inscricao_estadual (Inscrição Estadual) na tabela tenants

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;

-- Comentário para documentação
COMMENT ON COLUMN tenants.inscricao_estadual IS 'Inscrição Estadual (IE) da empresa para uso em PDFs de orçamentos e pedidos';
