-- A policy de SELECT realmente ativa em `profiles` (verificado direto no
-- banco via pg_policies) e "Users view own profile." USING (id = auth.uid()),
-- nao a "Users view profiles in their tenant." descrita em
-- 001_initial_schema.sql - em algum momento fora do historico de migracoes
-- que temos localmente, essa policy foi trocada/substituida. Resultado: cada
-- usuario so enxerga o proprio perfil, nunca o de colegas do mesmo tenant -
-- por isso a tela de Equipe so mostrava quem estava logado, e o nome de quem
-- fez cada ajuste de estoque nao aparecia para os outros usuarios do tenant.
--
-- Adiciona uma policy PERMISSIVE (OR com a existente, nao substitui) que
-- libera a visualizacao de qualquer perfil do mesmo tenant.
CREATE POLICY "Users view tenant profiles" ON profiles
  FOR SELECT USING (tenant_id = get_user_tenant_id());
