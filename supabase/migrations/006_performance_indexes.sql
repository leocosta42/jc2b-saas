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
-- PRODUTOS
-- ==============================
CREATE INDEX IF NOT EXISTS idx_produtos_tenant_id      ON produtos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_produtos_codigo         ON produtos(tenant_id, codigo);

-- ==============================
-- PEDIDOS
-- ==============================
CREATE INDEX IF NOT EXISTS idx_pedidos_tenant_id       ON pedidos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at      ON pedidos(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_tipo_status     ON pedidos(tenant_id, tipo, status);
CREATE INDEX IF NOT EXISTS idx_pedidos_cod_cliente     ON pedidos(tenant_id, cod_cliente);

-- ==============================
-- ITENS_PEDIDO
-- ==============================
CREATE INDEX IF NOT EXISTS idx_itens_pedido_pedido_id  ON itens_pedido(pedido_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido_produto_id ON itens_pedido(produto_id);
