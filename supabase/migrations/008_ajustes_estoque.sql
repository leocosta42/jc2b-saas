-- Historico de ajustes manuais de saldo de estoque (entrada manual, devolucao,
-- perda/dano, contagem fisica). Serve tambem como trilha de auditoria: por
-- isso nao existe policy de UPDATE/DELETE, os registros sao imutaveis.
CREATE TABLE ajustes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE RESTRICT,
  usuario_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  quantidade_anterior INTEGER NOT NULL,
  quantidade_nova INTEGER NOT NULL,
  motivo TEXT NOT NULL CHECK (motivo IN ('entrada_manual', 'devolucao', 'perda', 'contagem')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ajustes_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_ajustes_estoque_select" ON ajustes_estoque
  FOR SELECT USING (tenant_id = get_user_tenant_id());

-- Somente admin/gerente/dono podem lancar ajustes (mesmo criterio ja usado
-- para editar preco_custo/quantidade_estoque/bloqueado em produtos.ts).
CREATE POLICY "tenant_admins_ajustes_estoque_insert" ON ajustes_estoque
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND lower(profiles.role) IN ('admin', 'gerente', 'dono')
    )
  );

CREATE INDEX idx_ajustes_estoque_tenant ON ajustes_estoque(tenant_id);
CREATE INDEX idx_ajustes_estoque_produto ON ajustes_estoque(produto_id);
