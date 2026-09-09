-- Migration 016: Adicionar coluna ativo na tabela profiles
--
-- A coluna ativo permite desativar usuários sem deletá-los do banco de dados,
-- mantendo histórico e relacionamentos intactos.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Comentário descrevendo a coluna
COMMENT ON COLUMN profiles.ativo IS 'Flag para indicar se o usuário está ativo (true) ou desativado (false)';
