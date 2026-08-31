-- A tabela "tenants" só tinha policy de SELECT (001_initial_schema.sql).
-- Isso fazia a tela de Configurações falhar sempre ao salvar (nenhuma linha
-- era afetada pelo UPDATE, pois o RLS bloqueava silenciosamente).
--
-- A policy abaixo permite UPDATE apenas para usuários cujo profile pertence
-- ao mesmo tenant E tem papel de admin/gerente/dono. A checagem de role
-- também é feita em código (src/app/actions/configuracoes.ts), esta policy
-- é a camada de defesa no banco.
CREATE POLICY "tenant_admins_can_update_tenant" ON tenants
  FOR UPDATE
  USING (
    id = get_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND lower(profiles.role) IN ('admin', 'gerente', 'dono')
    )
  )
  WITH CHECK (
    id = get_user_tenant_id()
  );
