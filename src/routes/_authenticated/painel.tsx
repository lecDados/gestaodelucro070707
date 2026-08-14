import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Wallet,
  AlertTriangle,
  TrendingDown,
  Receipt,
  Plus,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { brl, num, inicioDoDia, unidadeLabel } from "@/lib/format";
import { statusEstoque } from "@/lib/tipos";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/painel")({
  component: Painel,
});

async function carregarPainel() {
  const hoje = inicioDoDia().toISOString();
  const seteDias = new Date(Date.now() - 6 * 86400000);
  seteDias.setHours(0, 0, 0, 0);

  const [vendasHoje, vendas7, produtos, perdasHoje, caixa] = await Promise.all([
    supabase.from("vendas").select("total, forma_pagamento").eq("status", "finalizada").gte("created_at", hoje),
    supabase.from("vendas").select("total, created_at").eq("status", "finalizada").gte("created_at", seteDias.toISOString()),
    supabase.from("produtos").select("*").eq("ativo", true),
    supabase.from("perdas").select("valor_estimado").gte("created_at", hoje),
    supabase.from("caixas").select("*").eq("status", "aberto").order("aberto_em", { ascending: false }).limit(1).maybeSingle(),
  ]);

  let valorCaixa = 0;
  if (caixa.data) {
    const [movs, vendasCaixa] = await Promise.all([
      supabase.from("movimentacoes_caixa").select("tipo, valor").eq("caixa_id", caixa.data.id),
      supabase.from("vendas").select("total").eq("caixa_id", caixa.data.id).eq("status", "finalizada").eq("forma_pagamento", "dinheiro"),
    ]);
    const entradas = (vendasCaixa.data ?? []).reduce((s, v) => s + Number(v.total), 0);
    const ajustes = (movs.data ?? []).reduce(
      (s, m) => s + (m.tipo === "suprimento" ? Number(m.valor) : -Number(m.valor)),
      0,
    );
    valorCaixa = Number(caixa.data.valor_inicial) + entradas + ajustes;
  }

  const itensTop = await supabase
    .from("itens_venda")
    .select("nome_produto, quantidade, unidade")
    .gte("created_at", seteDias.toISOString());

  const ranking = new Map<string, { qtd: number; unidade: string }>();
  for (const i of itensTop.data ?? []) {
    const atual = ranking.get(i.nome_produto) ?? { qtd: 0, unidade: i.unidade };
    atual.qtd += Number(i.quantidade);
    ranking.set(i.nome_produto, atual);
  }

  const porDia = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    porDia.set(d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), 0);
  }
  for (const v of vendas7.data ?? []) {
    const chave = new Date(v.created_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    if (porDia.has(chave)) porDia.set(chave, porDia.get(chave)! + Number(v.total));
  }

  const listaProdutos = produtos.data ?? [];
  return {
    faturamento: (vendasHoje.data ?? []).reduce((s, v) => s + Number(v.total), 0),
    quantidade: (vendasHoje.data ?? []).length,
    valorCaixa,
    caixaAberto: !!caixa.data,
    perdas: (perdasHoje.data ?? []).reduce((s, p) => s + Number(p.valor_estimado), 0),
    baixos: listaProdutos.filter((p) => statusEstoque(p) !== "normal"),
    grafico: [...porDia.entries()].map(([dia, total]) => ({ dia, total })),
    top: [...ranking.entries()]
      .sort((a, b) => b[1].qtd - a[1].qtd)
      .slice(0, 5)
      .map(([nome, v]) => ({ nome, ...v })),
  };
}

function Painel() {
  const { data, isLoading } = useQuery({ queryKey: ["painel"], queryFn: carregarPainel });

  if (isLoading || !data) {
    return <p className="text-lg text-muted-foreground">Carregando informações...</p>;
  }

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        descricao="Resumo do dia da sua quitanda"
        acoes={
          <Button asChild size="lg" className="h-12 text-base font-semibold">
            <Link to="/venda">
              <Plus className="size-5" /> Nova venda
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Vendas de hoje"
          valor={brl(data.faturamento)}
          detalhe={`${data.quantidade} venda${data.quantidade === 1 ? "" : "s"}`}
          icone={Receipt}
          tom="positivo"
        />
        <StatCard
          titulo="Valor em caixa"
          valor={brl(data.valorCaixa)}
          detalhe={data.caixaAberto ? "Caixa aberto" : "Caixa fechado"}
          icone={Wallet}
        />
        <StatCard
          titulo="Estoque baixo"
          valor={`${data.baixos.length} produto${data.baixos.length === 1 ? "" : "s"}`}
          detalhe="Precisam de reposição"
          icone={AlertTriangle}
          tom="alerta"
        />
        <StatCard
          titulo="Perdas de hoje"
          valor={brl(data.perdas)}
          detalhe="Produtos descartados"
          icone={TrendingDown}
          tom="perigo"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-semibold">Vendas dos últimos 7 dias</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.grafico}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="dia" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `R$ ${v}`} tickLine={false} axisLine={false} width={70} />
                <ReTooltip formatter={(v: number) => brl(v)} labelFormatter={(l) => `Dia ${l}`} />
                <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Mais vendidos</h2>
          {data.top.length === 0 ? (
            <p className="mt-3 text-base text-muted-foreground">Ainda não há vendas registradas.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.top.map((t) => (
                <li key={t.nome} className="flex items-center justify-between gap-3 text-base">
                  <span className="font-medium">{t.nome}</span>
                  <span className="text-muted-foreground">
                    {num(t.qtd)} {unidadeLabel(t.unidade)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Produtos acabando</h2>
          <Button asChild variant="outline" className="text-base">
            <Link to="/estoque">Ver estoque</Link>
          </Button>
        </div>
        {data.baixos.length === 0 ? (
          <p className="mt-3 text-base text-muted-foreground">Tudo certo com o estoque.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.baixos.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <span className="text-base font-medium">{p.nome}</span>
                <span
                  className={
                    statusEstoque(p) === "critico"
                      ? "text-base font-semibold text-destructive"
                      : "text-base font-semibold text-accent-foreground"
                  }
                >
                  {num(p.estoque_atual)} {unidadeLabel(p.tipo_venda)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="secondary" size="lg" className="h-12 text-base">
          <Link to="/caixa">
            <Wallet className="size-5" /> Controlar caixa
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg" className="h-12 text-base">
          <Link to="/produtos">
            <ShoppingCart className="size-5" /> Cadastrar produto
          </Link>
        </Button>
      </div>
    </>
  );
}