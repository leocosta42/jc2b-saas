-- Função que é executada toda vez que um usuário se cadastra no sistema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_tenant_id uuid;
BEGIN
  -- Tenta achar a empresa principal (Sua empresa única)
  SELECT id INTO default_tenant_id FROM public.tenants WHERE name = 'JC2B Matriz' LIMIT 1;

  -- Se a empresa ainda não existir, ele cria na hora (Acontecerá apenas no seu 1º cadastro)
  IF default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug) 
    VALUES ('JC2B Matriz', 'jc2b-matriz')
    RETURNING id INTO default_tenant_id;
  END IF;

  -- 2. Coloca todos os novos usuários (seus vendedores) DENTRO desta mesma e única empresa!
  INSERT INTO public.profiles (id, tenant_id, full_name, role)
  VALUES (
    new.id, 
    default_tenant_id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    'vendedor'
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gatilho (Trigger) que escuta a tabela auth.users do Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
