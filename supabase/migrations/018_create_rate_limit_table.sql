-- Migration 018: Criar tabela de rate limiting
--
-- Armazena tentativas falhadas de login e outras operações
-- para proteção contra brute force attacks

CREATE TABLE IF NOT EXISTS rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL, -- 'login', 'create_order', 'export_data', etc
  ip_address TEXT NOT NULL,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_rate_limit_email_action ON rate_limit_attempts(user_email, action, created_at DESC);
CREATE INDEX idx_rate_limit_ip_action ON rate_limit_attempts(ip_address, action, created_at DESC);
CREATE INDEX idx_rate_limit_created_at ON rate_limit_attempts(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas o sistema pode inserir logs via service role
CREATE POLICY "rate_limit_insert_service_role" ON rate_limit_attempts
  FOR INSERT
  WITH CHECK (true);

-- COMMENT
COMMENT ON TABLE rate_limit_attempts IS 'Rate limiting - proteção contra brute force attacks';
COMMENT ON COLUMN rate_limit_attempts.action IS 'Tipo de ação: login, create_order, export_data, etc';
COMMENT ON COLUMN rate_limit_attempts.success IS 'true se a ação foi bem-sucedida, false se falhou';
