import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { num, parseNum, unidadeLabel, dataBR, horaBR } from "@/lib/format";
import { statusEstoque, type Produto } from "@/lib/tipos";

export const Route = createFileRoute("/_authenticated/estoque")({
  component: Estoque,
});

type Acao = "entrada" | "saida" | "ajuste";

const rotulos: Record<Acao, string> = {
  entrada: "Entrada de estoque",
  saida: "Saída manual",
  ajuste: "Ajuste de estoque",
};

function Estoque() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [alvo, setAlvo] = useState<Produto | null>(null);
  const [acao, setAcao] = useState<Acao>("entrada");
  const [valor, setValor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [confirmarNegativo, setConfirmarNegativo] = useState(false);

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("*").order("nome");
      if (error) throw error;
      return data as unknown as Produto[];
    },
  });

  const { data: movimentacoes = [] } = useQuery({
    queryKey: ["movimentacoes_estoque"],
    queryFn: async () => {
      const { data } = await supabase
        .from("movimentacoes_estoque")
        .select("*, produtos(nome)")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const filtrados = useMemo(
    () => produtos.filter((p) => p.nome.toLowerCase().includes(busca.trim().toLowerCase())),
    [produtos, busca],
  );

  function abrir(p: Produto, a: Acao) {
    setAlvo(p);
    setAcao(a);
    setValor("");
    setMotivo("");
  }

  function delta() {
    if (!alvo) return 0;
    const v = parseNum(valor);
    if (acao === "entrada") return v;
    if (acao === "saida") return -v;
    return v - Number(alvo.estoque_atual);
  }

  async function aplicar(forcar = false) {
    if (!alvo) return;
    const d = delta();
    if (parseNum(valor) <= 0 && acao !== "ajuste") {
      toast.error("Informe uma quantidade maior que zero.");
      return;
    }
    if (!forcar && Number(alvo.estoque_atual) + d < 0) {
      setConfirmarNegativo(true);
      return;
    }
    const { error } = await supabase.rpc("registrar_movimentacao_estoque", {
      p_produto: alvo.id,
      p_tipo: acao,
      p_quantidade: d,
      p_motivo: motivo || rotulos[acao],
    });
    setConfirmarNegativo(false);
    if (error) {
      toast.error("Não foi possível atualizar o estoque.");
      return;
    }
    toast.success("Estoque atualizado!");
    setAlvo(null);
    qc.invalidateQueries();
  }

  const cor = {
    normal: "bg-success/15 text-success",
    baixo: "bg-warning/25 text-accent-foreground",
    critico: "bg-destructive/15 text-destructive",
  };
  const texto = { normal: "🟢 Normal", baixo: "🟡 Baixo", critico: "🔴 Crítico" };

  return (
    <>
      <PageHeader titulo="Estoque" descricao="Veja o que tem na loja e registre entradas e saídas" />

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar produto..."
          className="h-12 pl-12 text-base"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-base">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Produto</th>
              <th className="px-4 py-3 font-semibold">Quantidade</th>
              <th className="px-4 py-3 font-semibold">Mínimo</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtrados.map((p) => {
              const s = statusEstoque(p);
              return (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{p.nome}</td>
                  <td className="px-4 py-3">
                    {num(p.estoque_atual)} {unidadeLabel(p.tipo_venda)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {num(p.estoque_minimo)} {unidadeLabel(p.tipo_venda)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${cor[s]}`}>
                      {texto[s]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" className="text-base" onClick={() => abrir(p, "entrada")}>
                        Entrada
                      </Button>
                      <Button variant="outline" className="text-base" onClick={() => abrir(p, "saida")}>
                        Saída
                      </Button>
                      <Button variant="outline" className="text-base" onClick={() => abrir(p, "ajuste")}>
                        Ajustar
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-xl font-semibold">Últimas movimentações</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-base">
          <thead className="bg-secondary text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">Data</th>
              <th className="px-4 py-3 font-semibold">Produto</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Quantidade</th>
              <th className="px-4 py-3 font-semibold">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {movimentacoes.map((m: Record<string, unknown> & { id: string }) => (
              <tr key={m.id}>
                <td className="px-4 py-3">
                  {dataBR(m.created_at as string)} {horaBR(m.created_at as string)}
                </td>
                <td className="px-4 py-3">
                  {(m.produtos as { nome: string } | null)?.nome ?? "Produto removido"}
                </td>
                <td className="px-4 py-3 capitalize">{m.tipo as string}</td>
                <td
                  className={
                    Number(m.quantidade) < 0
                      ? "px-4 py-3 font-semibold text-destructive"
                      : "px-4 py-3 font-semibold text-success"
                  }
                >
                  {Number(m.quantidade) > 0 ? "+" : ""}
                  {num(m.quantidade as number)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{(m.motivo as string) ?? "-"}</td>
              </tr>
            ))}
            {movimentacoes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhuma movimentação ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!alvo} onOpenChange={(o) => !o && setAlvo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl">{rotulos[acao]}</DialogTitle>
          </DialogHeader>
          {alvo && (
            <div className="space-y-4">
              <p className="text-lg">
                <strong>{alvo.nome}</strong> — hoje tem {num(alvo.estoque_atual)}{" "}
                {unidadeLabel(alvo.tipo_venda)}
              </p>
              <div>
                <Label className="text-base">
                  {acao === "ajuste" ? "Quantidade correta no estoque" : "Quantidade"}
                </Label>
                <Input
                  autoFocus
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 h-14 text-2xl font-semibold"
                />
              </div>
              <div>
                <Label className="text-base">Motivo (opcional)</Label>
                <Input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="mt-1 h-12 text-base"
                  placeholder="Ex.: chegou carga nova"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="h-12 text-base" onClick={() => setAlvo(null)}>
              Cancelar
            </Button>
            <Button className="h-12 px-8 text-base font-semibold" onClick={() => aplicar()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmarNegativo} onOpenChange={setConfirmarNegativo}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">O estoque vai ficar negativo</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              A quantidade informada é maior do que o estoque atual. Deseja continuar mesmo assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-base">Não, voltar</AlertDialogCancel>
            <AlertDialogAction className="text-base" onClick={() => aplicar(true)}>
              Sim, continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}