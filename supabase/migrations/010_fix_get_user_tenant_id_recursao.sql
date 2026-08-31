-- get_user_tenant_id() e SECURITY INVOKER (padrao) e le a propria tabela
-- `profiles`, que tem uma policy de SELECT que depende dessa mesma funcao
-- ("tenant_id = get_user_tenant_id()"). Isso cria recursao na avaliacao do
-- RLS: ao tentar ler o perfil de OUTRO usuario do mesmo tenant, o Postgres
-- nao consegue resolver get_user_tenant_id() de forma confiavel, e a linha
-- acaba filtrada mesmo pertencendo ao tenant certo. Na pratica, cada usuario
-- so consegue enxergar o proprio perfil via `profiles` (afeta a tela de
-- Equipe, que lista todos os perfis do tenant, e o join com profiles() em
-- ajustes_estoque, que mostra quem fez cada ajuste).
--
-- Corrige marcando a funcao como SECURITY DEFINER: ela passa a rodar com o
-- privilegio de quem a criou (bypassa RLS internamente so para essa leitura
-- pontual do PROPRIO tenant_id do usuario logado), quebrando a recursao.
-- search_path fixo por seguranca (boa pratica recomendada para SECURITY
-- DEFINER no Postgres/Supabase).
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;
