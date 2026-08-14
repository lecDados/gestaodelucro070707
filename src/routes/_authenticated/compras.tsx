import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { brl, num, dataBR, parseNum, unidadeLabel } from "@/lib/format";
import type { Fornecedor, Produto } from "@/lib/tipos";

export const Route = createFileRoute("/_authenticated/compras")({
  component: Compras,
});

type Item = { produto: Produto; quantidade: number; preco_custo: number };

function Compras() {
  const qc = useQueryClient();
  const [fornecedorId, setFornecedorId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [custo, setCusto] = useState("");
  const [itens, setItens] = useState<Item[]>([]);

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await supabase.from("produtos").select("*").order("nome");
      return (data ?? []) as unknown as Produto[];
    },
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data } = await supabase.from("fornecedores").select("*").order("nome");
      return (data ?? []) as Fornecedor[];
    },
  });

  const { data: compras = [] } = useQuery({
    queryKey: ["compras"],
    queryFn: async () => {
      const { data } = await supabase
        .from("compras")
        .select("id, data, valor_total, fornecedores(nome)")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as unknown as {
        id: string;
        data: string;
        valor_total: number;
        fornecedores: { nome: string } | null;
      }[];
    },
  });

  const total = itens.reduce((s, i) => s + i.quantidade * i.preco_custo, 0);

  function adicionar() {
    const p = produtos.find((x) => x.id === produtoId);
    const q = parseNum(quantidade);
    const c = parseNum(custo);
    if (!p || q <= 0 || c <= 0) {
      toast.error("Escolha o produto e preencha quantidade e preço de custo.");
      return;
    }
    setItens([...itens, { produto: p, quantidade: q, preco_custo: c }]);
    setProdutoId("");
    setQuantidade("");
    setCusto("");
  }

  async function salvar() {
    if (itens.length === 0) {
      toast.error("Adicione pelo menos um produto.");
      return;
    }
    const { data: compra, error } = await supabase
      .from("compras")
      .insert({ fornecedor_id: fornecedorId || null, valor_total: total })
      .select("id")
      .single();
    if (error || !compra) {
      toast.error("Não foi possível salvar a compra.");
      return;
    }
    await supabase.from("itens_compra").insert(
      itens.map((i) => ({
        compra_id: compra.id,
        produto_id: i.produto.id,
        nome_produto: i.produto.nome,
        quantidade: i.quantidade,
        preco_custo: i.preco_custo,
        subtotal: i.quantidade * i.preco_custo,
      })),
    );
    for (const i of itens) {
      await supabase.rpc("registrar_movimentacao_estoque", {
        p_produto: i.produto.id,
        p_tipo: "compra",
        p_quantidade: i.quantidade,
        p_motivo: "Compra de mercadoria",
      });
      await supabase
        .from("produtos")
        .update({ preco_custo: i.preco_custo })
        .eq("id", i.produto.id);
    }
    toast.success("Compra registrada e estoque atualizado!");
    setItens([]);
    setFornecedorId("");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader titulo="Compras" descricao="Registre a mercadoria que chegou na loja" />

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-4">
            <Label className="text-base">Fornecedor</Label>
            <select
              value={fornecedorId}
              onChange={(e) => setFornecedorId(e.target.value)}
              className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
            >
              <option value="">Sem fornecedor</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <Label className="text-base">Produto</Label>
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
            >
              <option value="">Escolha o produto</option>
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-base">Quantidade</Label>
            <Input
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              inputMode="decimal"
              className="mt-1 h-12 text-lg"
            />
          </div>
          <div>
            <Label className="text-base">Preço de custo (R$)</Label>
            <Input
              value={custo}
              onChange={(e) => setCusto(e.target.value)}
              inputMode="decimal"
              className="mt-1 h-12 text-lg"
            />
          </div>
        </div>
        <Button className="mt-4 h-12 text-base font-semibold" onClick={adicionar}>
          Adicionar à compra
        </Button>

        {itens.length > 0 && (
          <div className="mt-5 space-y-2">
            {itens.map((i, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-base"
              >
                <span>
                  {i.produto.nome} — {num(i.quantidade)} {unidadeLabel(i.produto.tipo_venda)} ×{" "}
                  {brl(i.preco_custo)}
                </span>
                <span className="flex items-center gap-3 font-semibold">
                  {brl(i.quantidade * i.preco_custo)}
                  <button
                    onClick={() => setItens(itens.filter((_, k) => k !== idx))}
                    aria-label="Remover item"
                  >
                    <Trash2 className="size-5 text-destructive" />
                  </button>
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-2xl font-bold">
              <span>Total da compra</span>
              <span>{brl(total)}</span>
            </div>
            <Button className="h-14 w-full text-lg font-semibold" onClick={salvar}>
              Salvar compra
            </Button>
          </div>
        )}
      </div>

      <h2 className="mt-8 text-xl font-semibold">Últimas compras</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-base">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Data</th>
              <th className="px-4 py-3 font-semibold">Fornecedor</th>
              <th className="px-4 py-3 text-right font-semibold">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {compras.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">{dataBR(c.data)}</td>
                <td className="px-4 py-3">{c.fornecedores?.nome ?? "-"}</td>
                <td className="px-4 py-3 text-right font-semibold">{brl(c.valor_total)}</td>
              </tr>
            ))}
            {compras.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma compra registrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}