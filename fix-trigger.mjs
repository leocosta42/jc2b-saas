import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tgttjjwjbsqizfsjzcrm.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRndHRqandqYnNxaXpmc2p6Y3JtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzEwMTIzNywiZXhwIjoyMTAyNjc3MjM3fQ.sl9bwSflLfIzfAIRpnnyK-JrQGm4YryO82RFjIOQYBg'

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
