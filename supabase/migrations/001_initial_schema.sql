-- Create tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendedores
CREATE TABLE vendedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  comissao_percentual DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fornecedores
CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cnpj_cpf TEXT,
  telefone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  documento TEXT,
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Produtos (Estoque)
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL,
  sku TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_custo DECIMAL(10,2) DEFAULT 0,
  preco_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantidade_estoque INTEGER DEFAULT 0,
  estoque_minimo INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pedidos
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES clientes(id) ON DELETE RESTRICT,
  vendedor_id UUID REFERENCES vendedores(id) ON DELETE SET NULL,
  numero_pedido SERIAL,
  valor_total DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'Pendente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itens do Pedido
CREATE TABLE itens_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  pedido_id UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_pedido ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch tenant_id quickly
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid();
$$;

-- Tenants Policies
CREATE POLICY "Tenants are viewable by users who belong to them." ON tenants FOR SELECT USING (id = get_user_tenant_id());

-- Profiles Policies
CREATE POLICY "Users view profiles in their tenant." ON profiles FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users update own profile." ON profiles FOR UPDATE USING (id = auth.uid());

-- Vendedores Policies
CREATE POLICY "tenant_vendedores_select" ON vendedores FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_vendedores_insert" ON vendedores FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_vendedores_update" ON vendedores FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_vendedores_delete" ON vendedores FOR DELETE USING (tenant_id = get_user_tenant_id());

-- Fornecedores Policies
CREATE POLICY "tenant_fornecedores_select" ON fornecedores FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_fornecedores_insert" ON fornecedores FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_fornecedores_update" ON fornecedores FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_fornecedores_delete" ON fornecedores FOR DELETE USING (tenant_id = get_user_tenant_id());

-- Clientes Policies
CREATE POLICY "tenant_clientes_select" ON clientes FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_clientes_insert" ON clientes FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_clientes_update" ON clientes FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_clientes_delete" ON clientes FOR DELETE USING (tenant_id = get_user_tenant_id());

-- Produtos Policies
CREATE POLICY "tenant_produtos_select" ON produtos FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_produtos_insert" ON produtos FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_produtos_update" ON produtos FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_produtos_delete" ON produtos FOR DELETE USING (tenant_id = get_user_tenant_id());

-- Pedidos Policies
CREATE POLICY "tenant_pedidos_select" ON pedidos FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_pedidos_insert" ON pedidos FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_pedidos_update" ON pedidos FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_pedidos_delete" ON pedidos FOR DELETE USING (tenant_id = get_user_tenant_id());

-- Itens_pedido Policies
CREATE POLICY "tenant_itens_pedido_select" ON itens_pedido FOR SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_itens_pedido_insert" ON itens_pedido FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_itens_pedido_update" ON itens_pedido FOR UPDATE USING (tenant_id = get_user_tenant_id());
CREATE POLICY "tenant_itens_pedido_delete" ON itens_pedido FOR DELETE USING (tenant_id = get_user_tenant_id());
