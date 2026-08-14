import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { brl, num, dataBR, unidadeLabel, parseNum } from "@/lib/format";
import { MOTIVOS_PERDA, type Produto } from "@/lib/tipos";
import { TrendingDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/perdas")({
  component: Perdas,
});

type Perda = {
  id: string;
  data: string;
  motivo: string;
  nome_produto: string;
  quantidade: number;
  valor_estimado: number;
};

function Perdas() {
  const qc = useQueryClient();
  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState(MOTIVOS_PERDA[0]!);

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data } = await supabase.from("produtos").select("*").order("nome");
      return (data ?? []) as unknown as Produto[];
    },
  });

  const { data: perdas = [] } = useQuery({
    queryKey: ["perdas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("perdas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      return (data ?? []) as Perda[];
    },
  });

  const produto = produtos.find((p) => p.id === produtoId);
  const valorEstimado = produto ? Number(produto.preco_custo) * parseNum(quantidade) : 0;

  const totalMes = useMemo(() => {
    const mes = new Date().toISOString().slice(0, 7);
    return perdas
      .filter((p) => p.data.startsWith(mes))
      .reduce((s, p) => s + Number(p.valor_estimado), 0);
  }, [perdas]);

  async function registrar() {
    if (!produto) {
      toast.error("Escolha um produto.");
      return;
    }
    const q = parseNum(quantidade);
    if (q <= 0) {
      toast.error("Informe a quantidade perdida.");
      return;
    }
    const { error } = await supabase.from("perdas").insert({
      produto_id: produto.id,
      nome_produto: produto.nome,
      quantidade: q,
      motivo,
      valor_estimado: valorEstimado,
    });
    if (error) {
      toast.error("Não foi possível registrar a perda.");
      return;
    }
    await supabase.rpc("registrar_movimentacao_estoque", {
      p_produto: produto.id,
      p_tipo: "perda",
      p_quantidade: -q,
      p_motivo: motivo,
    });
    toast.success("Perda registrada e estoque atualizado.");
    setProdutoId("");
    setQuantidade("");
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader titulo="Perdas" descricao="Registre o que estragou ou foi jogado fora" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard titulo="Perdas neste mês" valor={brl(totalMes)} icone={TrendingDown} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Registrar perda</h2>
          <div className="mt-4 space-y-4">
            <div>
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
              <Label className="text-base">
                Quantidade {produto ? `(${unidadeLabel(produto.tipo_venda)})` : ""}
              </Label>
              <Input
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-14 text-2xl font-semibold"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-base">Motivo</Label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="mt-1 h-12 w-full rounded-md border border-input bg-background px-3 text-base"
              >
                {MOTIVOS_PERDA.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <p className="text-base text-muted-foreground">
              Prejuízo estimado: <strong className="text-foreground">{brl(valorEstimado)}</strong>
            </p>
            <Button className="h-14 w-full text-lg font-semibold" onClick={registrar}>
              Registrar perda
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-base">
            <thead className="bg-secondary text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-4 py-3 font-semibold">Quantidade</th>
                <th className="px-4 py-3 font-semibold">Motivo</th>
                <th className="px-4 py-3 text-right font-semibold">Prejuízo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {perdas.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{dataBR(p.data)}</td>
                  <td className="px-4 py-3 font-medium">{p.nome_produto}</td>
                  <td className="px-4 py-3">{num(p.quantidade)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.motivo}</td>
                  <td className="px-4 py-3 text-right font-semibold text-destructive">
                    {brl(p.valor_estimado)}
                  </td>
                </tr>
              ))}
              {perdas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhuma perda registrada. Ótimo sinal!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}