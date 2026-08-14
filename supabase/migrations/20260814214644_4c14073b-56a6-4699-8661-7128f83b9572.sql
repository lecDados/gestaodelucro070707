
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.perfis TO authenticated;
GRANT ALL ON public.perfis TO service_role;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "perfis proprio" ON public.perfis FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.perfis (id, nome) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  documento TEXT,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias ON DELETE SET NULL,
  fornecedor_id UUID REFERENCES public.fornecedores ON DELETE SET NULL,
  tipo_venda TEXT NOT NULL DEFAULT 'kg' CHECK (tipo_venda IN ('kg','unidade','caixa')),
  preco_custo NUMERIC(12,2) NOT NULL DEFAULT 0,
  preco_venda NUMERIC(12,2) NOT NULL DEFAULT 0,
  estoque_atual NUMERIC(12,3) NOT NULL DEFAULT 0,
  estoque_minimo NUMERIC(12,3) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.caixas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valor_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_final NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado')),
  aberto_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  fechado_em TIMESTAMPTZ,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero BIGSERIAL,
  caixa_id UUID REFERENCES public.caixas ON DELETE SET NULL,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('dinheiro','pix','debito','credito')),
  valor_recebido NUMERIC(12,2),
  troco NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'finalizada' CHECK (status IN ('finalizada','cancelada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.itens_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES public.vendas ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos ON DELETE SET NULL,
  nome_produto TEXT NOT NULL,
  unidade TEXT NOT NULL,
  quantidade NUMERIC(12,3) NOT NULL,
  preco_unitario NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  custo_unitario NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID REFERENCES public.fornecedores ON DELETE SET NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.itens_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id UUID NOT NULL REFERENCES public.compras ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos ON DELETE SET NULL,
  nome_produto TEXT NOT NULL,
  quantidade NUMERIC(12,3) NOT NULL,
  preco_custo NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida','ajuste','venda','compra','perda','estorno')),
  quantidade NUMERIC(12,3) NOT NULL,
  saldo_depois NUMERIC(12,3) NOT NULL DEFAULT 0,
  motivo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.perdas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos ON DELETE SET NULL,
  nome_produto TEXT NOT NULL,
  quantidade NUMERIC(12,3) NOT NULL,
  motivo TEXT NOT NULL,
  valor_estimado NUMERIC(12,2) NOT NULL DEFAULT 0,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.movimentacoes_caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caixa_id UUID NOT NULL REFERENCES public.caixas ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('suprimento','despesa','sangria')),
  valor NUMERIC(12,2) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.configuracoes (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nome_loja TEXT NOT NULL DEFAULT 'Minha Quitanda',
  balanca_porta TEXT,
  balanca_ativa BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.configuracoes (id) VALUES (1);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['categorias','fornecedores','produtos','caixas','vendas','itens_venda','compras','itens_compra','movimentacoes_estoque','perdas','movimentacoes_caixa','configuracoes']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "acesso autenticado" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
GRANT USAGE, SELECT ON SEQUENCE public.vendas_numero_seq TO authenticated;

CREATE TRIGGER t_fornecedores BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_produtos BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_itens_venda_venda ON public.itens_venda(venda_id);
CREATE INDEX idx_vendas_created ON public.vendas(created_at);
CREATE INDEX idx_mov_estoque_produto ON public.movimentacoes_estoque(produto_id);

CREATE OR REPLACE FUNCTION public.registrar_movimentacao_estoque(p_produto UUID, p_tipo TEXT, p_quantidade NUMERIC, p_motivo TEXT)
RETURNS NUMERIC LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE novo NUMERIC;
BEGIN
  UPDATE public.produtos SET estoque_atual = estoque_atual + p_quantidade WHERE id = p_produto RETURNING estoque_atual INTO novo;
  INSERT INTO public.movimentacoes_estoque (produto_id, tipo, quantidade, saldo_depois, motivo)
  VALUES (p_produto, p_tipo, p_quantidade, COALESCE(novo,0), p_motivo);
  RETURN novo;
END; $$;
REVOKE ALL ON FUNCTION public.registrar_movimentacao_estoque(UUID, TEXT, NUMERIC, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.registrar_movimentacao_estoque(UUID, TEXT, NUMERIC, TEXT) TO authenticated;
