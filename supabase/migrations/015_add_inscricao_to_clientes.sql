-- Migration 015: Adicionar coluna inscricao (Inscrição Estadual) na tabela clientes
--
-- O campo de Inscrição Estadual existia no formulário mas não era persistido
-- na tabela clientes. Agora a coluna é adicionada para que o valor possa ser
-- salvo e exibido nos pedidos, orçamentos e seus respectivos documentos.

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS inscricao TEXT;
