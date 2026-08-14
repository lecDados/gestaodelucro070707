import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Wallet, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { brl, dataBR, horaBR, parseNum, pagamentoLabel } from "@/lib/format";
import type { Caixa as CaixaTipo } from "@/lib/tipos";

export const Route = createFileRoute("/_authenticated/caixa")({
  component: CaixaPage,
});

type Mov = { id: string; tipo: string; valor: number; descricao: string | null; created_at: string };
type VendaCaixa = { id: string; total: number; forma_pagamento: string; created_at: string };

function CaixaPage() {
  const qc = useQueryClient();
  const [valorInicial, setValorInicial] = useState("");
  const [valorFinal, setValorFinal] = useState("");
  const [obs, setObs] = useState("");
  const [movValor, setMovValor] = useState("");
  const [movDescricao, setMovDescricao] = useState("");

  const { data: caixa } = useQuery({
    queryKey: ["caixa_aberto"],
    queryFn: async () => {
      const { data } = await supabase
        .from("caixas")
        .select("*")
        .eq("status", "aberto")
        .order("aberto_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as unknown as CaixaTipo) ?? null;
    },
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["movimentacoes_caixa", caixa?.id],
    enabled: !!caixa,
    queryFn: async () => {
      const { data } = await supabase
        .from("movimentacoes_caixa")
        .select("*")
        .eq("caixa_id", caixa!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Mov[];
    },
  });

  const { data: vendas = [] } = useQuery({
    queryKey: ["vendas_caixa", caixa?.id],
    enabled: !!caixa,
    queryFn: async () => {
      const { data } = await supabase
        .from("vendas")
        .select("id, total, forma_pagamento, created_at")
        .eq("caixa_id", caixa!.id)
        .eq("status", "finalizada")
        .order("created_at", { ascending: false });
      return (data ?? []) as VendaCaixa[];
    },
  });

  const { data: fechados = [] } = useQuery({
    queryKey: ["caixas_fechados"],
    queryFn: async () => {
      const { data } = await supabase
        .from("caixas")
        .select("*")
        .eq("status", "fechado")
        .order("fechado_em", { ascending: false })
        .limit(10);
      return (data ?? []) as unknown as CaixaTipo[];
    },
  });

  const vendasDinheiro = vendas
    .filter((v) => v.forma_pagamento === "dinheiro")
    .reduce((s, v) => s + Number(v.total), 0);
  const totalVendas = vendas.reduce((s, v) => s + Number(v.total), 0);
  const suprimentos = movimentacoes
    .filter((m) => m.tipo === "suprimento")
    .reduce((s, m) => s + Number(m.valor), 0);
  const sangrias = movimentacoes
    .filter((m) => m.tipo === "sangria")
    .reduce((s, m) => s + Number(m.valor), 0);
  const esperado = caixa
    ? Number(caixa.valor_inicial) + vendasDinheiro + suprimentos - sangrias
    : 0;
  const diferenca = parseNum(valorFinal) - esperado;

  async function abrir() {
    const { error } = await supabase
      .from("caixas")
      .insert({ valor_inicial: parseNum(valorInicial), status: "aberto" });
    if (error) {
      toast.error("Não foi possível abrir o caixa.");
      return;
    }
    toast.success("Caixa aberto! Bom trabalho.");
    setValorInicial("");
    qc.invalidateQueries();
  }

  async function fechar() {
    if (!caixa) return;
    const { error } = await supabase
      .from("caixas")
      .update({
        status: "fechado",
        valor_final: parseNum(valorFinal),
        fechado_em: new Date().toISOString(),
        observacao: obs || null,
      })
      .eq("id", caixa.id);
    if (error) {
      toast.error("Não foi possível fechar o caixa.");
      return;
    }
    toast.success("Caixa fechado.");
    setValorFinal("");
    setObs("");
    qc.invalidateQueries();
  }

  async function movimentar(tipo: "sangria" | "suprimento") {
    if (!caixa) return;
    const v = parseNum(movValor);
    if (v <= 0) {
      toast.error("Informe um valor.");
      return;
    }
    const { error } = await supabase
      .from("movimentacoes_caixa")
      .insert({ caixa_id: caixa.id, tipo, valor: v, descricao: movDescricao || null });
    if (error) {
      toast.error("Não foi possível registrar.");
      return;
    }
    toast.success(tipo === "sangria" ? "Retirada registrada." : "Entrada registrada.");
    setMovValor("");
    setMovDescricao("");
    qc.invalidateQueries({ queryKey: ["movimentacoes_caixa"] });
  }

  if (!caixa) {
    return (
      <>
        <PageHeader titulo="Caixa" descricao="Abra o caixa para começar o dia" />
        <div className="max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Abrir caixa</h2>
          <p className="mt-1 text-base text-muted-foreground">
            Quanto de dinheiro tem na gaveta agora?
          </p>
          <Label className="mt-4 block text-base">Valor inicial (R$)</Label>
          <Input
            value={valorInicial}
            onChange={(e) => setValorInicial(e.target.value)}
            inputMode="decimal"
            className="mt-1 h-14 text-2xl font-semibold"
            placeholder="0,00"
          />
          <Button className="mt-4 h-14 w-full text-lg font-semibold" onClick={abrir}>
            Abrir caixa
          </Button>
        </div>
        <HistoricoCaixas fechados={fechados} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        titulo="Caixa"
        descricao={`Aberto em ${dataBR(caixa.aberto_em)} às ${horaBR(caixa.aberto_em)}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Valor inicial" valor={brl(caixa.valor_inicial)} icone={Wallet} />
        <StatCard
          titulo="Vendas do caixa"
          valor={brl(totalVendas)}
          detalhe={`${brl(vendasDinheiro)} em dinheiro`}
          icone={ArrowUpCircle}
          tom="positivo"
        />
        <StatCard titulo="Retiradas (sangria)" valor={brl(sangrias)} icone={ArrowDownCircle} tom="alerta" />
        <StatCard
          titulo="Deve ter na gaveta"
          valor={brl(esperado)}
          detalhe="Dinheiro em espécie"
          icone={Wallet}
          tom="positivo"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Retirar ou colocar dinheiro</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-base">Valor (R$)</Label>
              <Input
                value={movValor}
                onChange={(e) => setMovValor(e.target.value)}
                inputMode="decimal"
                className="mt-1 h-12 text-lg"
                placeholder="0,00"
              />
            </div>
            <div>
              <Label className="text-base">Motivo</Label>
              <Input
                value={movDescricao}
                onChange={(e) => setMovDescricao(e.target.value)}
                className="mt-1 h-12 text-base"
                placeholder="Ex.: pagamento do entregador"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button
              variant="outline"
              className="h-12 flex-1 text-base font-semibold"
              onClick={() => movimentar("sangria")}
            >
              Retirar dinheiro
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-1 text-base font-semibold"
              onClick={() => movimentar("suprimento")}
            >
              Colocar dinheiro
            </Button>
          </div>

          <div className="mt-5 space-y-2">
            {movimentacoes.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-base">
                <span>
                  {horaBR(m.created_at)} — {m.tipo === "sangria" ? "Retirada" : "Entrada"}
                  {m.descricao ? ` (${m.descricao})` : ""}
                </span>
                <span
                  className={
                    m.tipo === "sangria"
                      ? "font-semibold text-destructive"
                      : "font-semibold text-success"
                  }
                >
                  {m.tipo === "sangria" ? "-" : "+"}
                  {brl(m.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Fechar o caixa</h2>
          <p className="mt-1 text-base text-muted-foreground">
            Conte o dinheiro da gaveta e digite o total.
          </p>
          <Label className="mt-4 block text-base">Dinheiro contado (R$)</Label>
          <Input
            value={valorFinal}
            onChange={(e) => setValorFinal(e.target.value)}
            inputMode="decimal"
            className="mt-1 h-14 text-2xl font-semibold"
            placeholder="0,00"
          />
          {valorFinal !== "" && (
            <p
              className={
                Math.abs(diferenca) < 0.01
                  ? "mt-3 text-lg font-semibold text-success"
                  : "mt-3 text-lg font-semibold text-destructive"
              }
            >
              {Math.abs(diferenca) < 0.01
                ? "Tudo certo, valor bate!"
                : diferenca > 0
                  ? `Sobrando ${brl(diferenca)}`
                  : `Faltando ${brl(Math.abs(diferenca))}`}
            </p>
          )}
          <Label className="mt-4 block text-base">Observação (opcional)</Label>
          <Input
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            className="mt-1 h-12 text-base"
          />
          <Button className="mt-4 h-14 w-full text-lg font-semibold" onClick={fechar}>
            Fechar caixa
          </Button>
        </div>
      </div>

      <h2 className="mt-8 text-xl font-semibold">Vendas deste caixa</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-base">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Hora</th>
              <th className="px-4 py-3 font-semibold">Pagamento</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendas.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-3">{horaBR(v.created_at)}</td>
                <td className="px-4 py-3">{pagamentoLabel(v.forma_pagamento)}</td>
                <td className="px-4 py-3 text-right font-semibold">{brl(v.total)}</td>
              </tr>
            ))}
            {vendas.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma venda registrada ainda hoje.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <HistoricoCaixas fechados={fechados} />
    </>
  );
}

function HistoricoCaixas({ fechados }: { fechados: CaixaTipo[] }) {
  if (fechados.length === 0) return null;
  return (
    <>
      <h2 className="mt-8 text-xl font-semibold">Caixas anteriores</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-base">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Abertura</th>
              <th className="px-4 py-3 font-semibold">Fechamento</th>
              <th className="px-4 py-3 text-right font-semibold">Inicial</th>
              <th className="px-4 py-3 text-right font-semibold">Final</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {fechados.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  {dataBR(c.aberto_em)} {horaBR(c.aberto_em)}
                </td>
                <td className="px-4 py-3">
                  {dataBR(c.fechado_em)} {horaBR(c.fechado_em)}
                </td>
                <td className="px-4 py-3 text-right">{brl(c.valor_inicial)}</td>
                <td className="px-4 py-3 text-right font-semibold">{brl(c.valor_final)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}