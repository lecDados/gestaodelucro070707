export type Produto = {
  id: string;
  nome: string;
  categoria_id: string | null;
  fornecedor_id: string | null;
  tipo_venda: "kg" | "unidade" | "caixa";
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  ativo: boolean;
};

export type Categoria = { id: string; nome: string };

export type Fornecedor = {
  id: string;
  nome: string;
  telefone: string | null;
  documento: string | null;
  endereco: string | null;
  observacoes: string | null;
};

export type Caixa = {
  id: string;
  valor_inicial: number;
  valor_final: number | null;
  status: "aberto" | "fechado";
  aberto_em: string;
  fechado_em: string | null;
  observacao: string | null;
};

export type Venda = {
  id: string;
  numero: number;
  total: number;
  forma_pagamento: "dinheiro" | "pix" | "debito" | "credito";
  valor_recebido: number | null;
  troco: number;
  status: "finalizada" | "cancelada";
  created_at: string;
};

export type ItemCarrinho = {
  produto: Produto;
  quantidade: number;
};

export const statusEstoque = (p: { estoque_atual: number; estoque_minimo: number }) => {
  if (p.estoque_atual <= 0) return "critico" as const;
  if (p.estoque_atual <= p.estoque_minimo * 0.5) return "critico" as const;
  if (p.estoque_atual <= p.estoque_minimo) return "baixo" as const;
  return "normal" as const;
};

export const MOTIVOS_PERDA = [
  "Produto estragado",
  "Produto amassado",
  "Vencimento",
  "Quebra",
  "Outros",
];