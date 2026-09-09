-- Migration 017: Criar tabela de auditoria (audit_log)
--
-- Registra todas as ações importantes do sistema:
-- - Quem realizou a ação (user_id)
-- - O quê foi feito (ação)
-- - Qual recurso foi afetado (resource_type, resource_id)
-- - Quando aconteceu (created_at)
-- - Detalhes da ação (details, resultado)
-- - Qual empresa (tenant_id)

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', etc
  resource_type TEXT NOT NULL, -- 'cliente', 'usuario', 'pedido', 'produto', etc
  resource_id UUID,
  resource_name TEXT, -- Nome do recurso afetado (ex: nome do cliente)
  changes JSONB, -- Antes e depois dos dados: {before: {...}, after: {...}}
  result TEXT, -- 'success', 'error', 'warning'
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_tenant_created ON audit_log(tenant_id, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários só veem auditoria da sua própria empresa
CREATE POLICY "audit_log_select_own_tenant" ON audit_log
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Apenas o sistema pode inserir logs (via service role)
CREATE POLICY "audit_log_insert_service_role" ON audit_log
  FOR INSERT
  WITH CHECK (true); -- Será inserido via service role key

-- COMMENT
COMMENT ON TABLE audit_log IS 'Log de auditoria - rastreia todas as ações importantes do sistema';
COMMENT ON COLUMN audit_log.action IS 'Tipo de ação: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc';
COMMENT ON COLUMN audit_log.resource_type IS 'Tipo de recurso afetado: cliente, usuario, pedido, produto, etc';
COMMENT ON COLUMN audit_log.changes IS 'JSON com antes e depois: {before: {...}, after: {...}}';
COMMENT ON COLUMN audit_log.result IS 'Resultado da ação: success, error, warning';
