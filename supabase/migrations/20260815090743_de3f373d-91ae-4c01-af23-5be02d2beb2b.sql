DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['categorias','fornecedores','produtos','caixas','vendas','itens_venda','compras','itens_compra','movimentacoes_estoque','perdas','movimentacoes_caixa','configuracoes']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO anon', t);
    EXECUTE format('DROP POLICY IF EXISTS "acesso publico" ON public.%I', t);
    EXECUTE format('CREATE POLICY "acesso publico" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

GRANT USAGE, SELECT ON SEQUENCE public.vendas_numero_seq TO anon;
GRANT EXECUTE ON FUNCTION public.registrar_movimentacao_estoque(UUID, TEXT, NUMERIC, TEXT) TO anon;