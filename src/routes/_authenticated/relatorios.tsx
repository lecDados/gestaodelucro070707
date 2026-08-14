import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, num } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/relatorios")({
  component: Relatorios,
});

const hoje = () => new Date().toISOString().slice(0, 10);
const inicioMes = () => new Date().toISOString().slice(0, 8) + "01";

function Relatorios() {
  const [de, setDe] = useState(inicioMes());
  const [ate, setAte] = useState(hoje());

  const { data } = useQuery({
    queryKey: ["relatorio", de, ate],
    queryFn: async () => {
      const inicio = `${de}T00:00:00`;
      const fim = `${ate}T23:59:59`;
      const [vendas, itens, perdas] = await Promise.all([
        supabase
          .from("vendas")
          .select("id, total, forma_pagamento")
          .eq("status", "finalizada")
          .gte("created_at", inicio)
          .lte("created_at", fim),
        supabase
          .from("itens_venda")
          .select("nome_produto, quantidade, subtotal, custo_unitario, created_at")
          .gte("created_at", inicio)
          .lte("created_at", fim),
        supabase.from("perdas").select("valor_estimado").gte("data", de).lte("data", ate),
      ]);
      return {
        vendas: vendas.data ?? [],
        itens: itens.data ?? [],
        perdas: perdas.data ?? [],
      };
    },
  });

  const vendas = data?.vendas ?? [];
  const itens = data?.itens ?? [];
  const faturamento = vendas.reduce((s, v) => s + Number(v.total), 0);
  const custo = itens.reduce((s, i) => s + Number(i.custo_unitario) * Number(i.quantidade), 0);
  const perdasTotal = (data?.perdas ?? []).reduce((s, p) => s + Number(p.valor_estimado), 0);
  const lucro = faturamento - custo - perdasTotal;

  const porProduto = Object.values(
    itens.reduce<Record<string, { nome: string; qtd: number; valor: number }>>((acc, i) => {
      const k = i.nome_produto;
      acc[k] ??= { nome: k, qtd: 0, valor: 0 };
      acc[k]!.qtd += Number(i.quantidade);
      acc[k]!.valor += Number(i.subtotal);
      return acc;
    }, {}),
  ).sort((a, b) => b.valor - a.valor);

  const porPagamento = Object.entries(
    vendas.reduce<Record<string, number>>((acc, v) => {
      acc[v.forma_pagamento] = (acc[v.forma_pagamento] ?? 0) + Number(v.total);
      return acc;
    }, {}),
  );

  return (
    <>
      <PageHeader titulo="Relatórios" descricao="Veja quanto vendeu e quanto sobrou" />

      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <Label className="text-base">De</Label>
          <Input
            type="date"
            value={de}
            onChange={(e) => setDe(e.target.value)}
            className="mt-1 h-12 text-base"
          />
        </div>
        <div>
          <Label className="text-base">Até</Label>
          <Input
            type="date"
            value={ate}
            onChange={(e) => setAte(e.target.value)}
            className="mt-1 h-12 text-base"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Faturamento" valor={brl(faturamento)} icone={DollarSign} tom="positivo" />
        <StatCard titulo="Custo da mercadoria" valor={brl(custo)} icone={ShoppingCart} />
        <StatCard titulo="Perdas" valor={brl(perdasTotal)} icone={TrendingDown} tom="perigo" />
        <StatCard
          titulo="Lucro estimado"
          valor={brl(lucro)}
          detalhe={`${vendas.length} vendas no período`}
          icone={TrendingUp}
          tom={lucro >= 0 ? "positivo" : "perigo"}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <h2 className="border-b border-border px-4 py-3 text-lg font-semibold">
            Produtos mais vendidos
          </h2>
          <table className="w-full text-base">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-4 py-3 text-right font-semibold">Quantidade</th>
                <th className="px-4 py-3 text-right font-semibold">Total vendido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {porProduto.map((p) => (
                <tr key={p.nome}>
                  <td className="px-4 py-3 font-medium">{p.nome}</td>
                  <td className="px-4 py-3 text-right">{num(p.qtd)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{brl(p.valor)}</td>
                </tr>
              ))}
              {porProduto.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma venda no período escolhido.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Formas de pagamento</h2>
          <div className="mt-4 space-y-3">
            {porPagamento.map(([forma, valor]) => (
              <div key={forma} className="flex justify-between text-base">
                <span className="capitalize">{forma}</span>
                <span className="font-semibold">{brl(valor)}</span>
              </div>
            ))}
            {porPagamento.length === 0 && (
              <p className="text-base text-muted-foreground">Sem dados no período.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}