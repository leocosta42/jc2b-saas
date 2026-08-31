import { createClient } from '@supabase/supabase-js'

process.loadEnvFile('.env.local')
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
})

async function run() {
  const query = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    DECLARE
      default_tenant_id uuid;
    BEGIN
      -- Busca a primeira empresa existente no banco (JC2B PARTS)
      SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;

      IF default_tenant_id IS NULL THEN
        INSERT INTO public.tenants (name, slug) 
        VALUES ('JC2B Matriz', 'jc2b-matriz')
        RETURNING id INTO default_tenant_id;
      END IF;

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
  `
  
  const { data, error } = await supabase.rpc('exec_sql', { query: query })
  // Since we might not have exec_sql RPC, we can just run this query via psql or rest. But Supabase JS client cannot execute raw SQL without RPC.
}
run();
