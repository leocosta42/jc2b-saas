-- Ajusta o saldo de um produto de forma atomica (UPDATE ... WHERE ... RETURNING),
-- eliminando a condicao de corrida do padrao "ler saldo em JS, calcular, gravar"
-- usado em vendas.ts (duas vendas simultaneas do mesmo produto podiam ambas
-- passar pela checagem de saldo e ambas decrementar a partir do mesmo valor lido).
--
-- p_delta negativo = baixa (venda). So aplica se o resultado nao ficar negativo.
-- p_delta positivo = devolucao/estorno.
-- Retorna o novo saldo, ou NULL se o produto nao existe nesse tenant OU se a
-- baixa deixaria o saldo negativo (chamador trata NULL como "nao foi possivel").
--
-- SECURITY INVOKER (padrao): roda com a permissao de quem chama, entao a
-- policy "tenant_produtos_update" do RLS continua sendo a autoridade final
-- sobre quem pode alterar o que - o parametro p_tenant_id aqui e so uma
-- camada extra de defesa, consistente com o resto do codigo.
CREATE OR REPLACE FUNCTION public.ajustar_estoque(
  p_produto_id UUID,
  p_tenant_id UUID,
  p_delta INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_novo_saldo INTEGER;
BEGIN
  UPDATE produtos
  SET quantidade_estoque = quantidade_estoque + p_delta
  WHERE id = p_produto_id
    AND tenant_id = p_tenant_id
    AND quantidade_estoque + p_delta >= 0
  RETURNING quantidade_estoque INTO v_novo_saldo;

  RETURN v_novo_saldo;
END;
$$;
