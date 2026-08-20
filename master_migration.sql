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
  codigo TEXT,
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
  ncm TEXT,
  peso DECIMAL(10,3) DEFAULT 0,
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
-- Adicionar campos de Código (Identificação) nas tabelas principais
ALTER TABLE clientes
ADD COLUMN codigo TEXT,
ADD COLUMN status TEXT DEFAULT 'Ativo';

ALTER TABLE vendedores
ADD COLUMN codigo TEXT,
ADD COLUMN status TEXT DEFAULT 'Ativo';

ALTER TABLE fornecedores
ADD COLUMN codigo TEXT,
ADD COLUMN status TEXT DEFAULT 'Ativo';

-- Atualizar Produtos
ALTER TABLE produtos
ADD COLUMN um TEXT DEFAULT 'UN',
ADD COLUMN status TEXT DEFAULT 'Ativo';

-- Atualizar Pedidos/Orçamentos
ALTER TABLE pedidos
ADD COLUMN tipo TEXT DEFAULT 'Pedido', -- 'Pedido' ou 'Orçamento'
ADD COLUMN data_entrega TIMESTAMPTZ,
ADD COLUMN comissao_percentual DECIMAL(5,2) DEFAULT 0,
ADD COLUMN comissao_rs DECIMAL(12,2) DEFAULT 0,
ADD COLUMN mes TEXT; -- Pode ser derivado da data de emissão, mas mantendo para compatibilidade com a planilha

-- Atualizar Itens do Pedido (Base Estatísticas)
ALTER TABLE itens_pedido
ADD COLUMN um TEXT DEFAULT 'UN',
ADD COLUMN valor_custo DECIMAL(10,2) DEFAULT 0,
ADD COLUMN lucro_venda DECIMAL(12,2) GENERATED ALWAYS AS ((preco_unitario - valor_custo) * quantidade) STORED,
ADD COLUMN item_sequencia INTEGER; -- Numero do item no pedido (ex: Item 1, Item 2)
-- Migration 004: Adicionar campos de endereço completo e contato na tabela clientes

-- Renomear 'documento' para 'cpf_cnpj' (padrão do sistema)
ALTER TABLE clientes
  RENAME COLUMN documento TO cpf_cnpj;

-- Adicionar campos de endereço detalhado
ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS celular TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS rua TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS estado TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Ativo';

-- Adicionar campos de endereço nos vendedores também (caso não existam)
ALTER TABLE vendedores
  ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS rua TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS estado TEXT;

-- Adicionar campos de endereço nos fornecedores também
ALTER TABLE fornecedores
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS rua TEXT,
  ADD COLUMN IF NOT EXISTS numero TEXT,
  ADD COLUMN IF NOT EXISTS complemento TEXT,
  ADD COLUMN IF NOT EXISTS bairro TEXT,
  ADD COLUMN IF NOT EXISTS cidade TEXT,
  ADD COLUMN IF NOT EXISTS estado TEXT;
-- Migration 005: Adicionar campos para suportar Orçamentos e espelhar o PDF

-- 1. Adicionar campos na tabela 'pedidos'
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'PEDIDO', -- 'ORCAMENTO' ou 'PEDIDO'
  ADD COLUMN IF NOT EXISTS data_emissao DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS data_entrega DATE,
  ADD COLUMN IF NOT EXISTS forma_pagamento TEXT,
  ADD COLUMN IF NOT EXISTS observacoes TEXT,
  ADD COLUMN IF NOT EXISTS desconto_total DECIMAL(12,2) DEFAULT 0;

-- 2. Adicionar campos na tabela 'itens_pedido'
ALTER TABLE itens_pedido
  ADD COLUMN IF NOT EXISTS desconto_percentual DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unidade_medida TEXT DEFAULT 'UN';

-- 3. Atualizar a fórmula de subtotal (para considerar o desconto)
-- Como a coluna era GENERATED ALWAYS, precisamos dropá-la e recriar
ALTER TABLE itens_pedido DROP COLUMN IF EXISTS subtotal;

ALTER TABLE itens_pedido 
  ADD COLUMN subtotal DECIMAL(12,2) 
  GENERATED ALWAYS AS (
    (quantidade * preco_unitario) * (1 - COALESCE(desconto_percentual, 0) / 100.0)
  ) STORED;
-- Migration: 006_performance_indexes
-- Adiciona índices estratégicos para acelerar queries em 10-100x com grandes volumes de dados

-- ==============================
-- CLIENTES
-- ==============================
CREATE INDEX IF NOT EXISTS idx_clientes_tenant_id      ON clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_cnpj       ON clientes(tenant_id, cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_clientes_nome           ON clientes(tenant_id, nome);

-- ==============================
-- FORNECEDORES
-- ==============================
CREATE INDEX IF NOT EXISTS idx_fornecedores_tenant_id  ON fornecedores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj_cpf   ON fornecedores(tenant_id, cnpj_cpf);
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome       ON fornecedores(tenant_id, nome);

-- ==============================
-- VENDEDORES
-- ==============================
CREATE INDEX IF NOT EXISTS idx_vendedores_tenant_id    ON vendedores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendedores_cpf_cnpj     ON vendedores(tenant_id, cpf_cnpj);

-- ==============================
-- PRODUTOS (campo SKU, nao codigo)
-- ==============================
CREATE INDEX IF NOT EXISTS idx_produtos_tenant_id      ON produtos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_produtos_sku            ON produtos(tenant_id, sku);

-- ==============================
-- PEDIDOS
-- ==============================
CREATE INDEX IF NOT EXISTS idx_pedidos_tenant_id       ON pedidos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at      ON pedidos(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_status          ON pedidos(tenant_id, status);

-- ==============================
-- ITENS_PEDIDO
-- ==============================
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id  ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_produto_id ON itens_pedido(produto_id);
