import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, ShoppingCart, Scale, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
import { brl, num, parseNum, unidadeLabel, pagamentoLabel } from "@/lib/format";
import type { ItemCarrinho, Produto } from "@/lib/tipos";

export const Route = createFileRoute("/_authenticated/venda")({
  component: NovaVenda,
});

const FORMAS = ["dinheiro", "pix", "debito", "credito"] as const;

function NovaVenda() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState("");
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [pagando, setPagando] = useState(false);
  const [forma, setForma] = useState<(typeof FORMAS)[number]>("dinheiro");
  const [recebido, setRecebido] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data as unknown as Produto[];
    },
  });

  const { data: config } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: async () => {
      const { data } = await supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  const filtrados = useMemo(
    () =>
      produtos.filter((p) => p.nome.toLowerCase().includes(busca.trim().toLowerCase())),
    [produtos, busca],
  );

  const total = carrinho.reduce(
    (s, i) => s + i.quantidade * Number(i.produto.preco_venda),
    0,
  );
  const qtdNum = parseNum(quantidade);
  const troco = Math.max(0, parseNum(recebido) - total);

  function adicionar() {
    if (!selecionado || qtdNum <= 0) {
      toast.error("Informe uma quantidade maior que zero.");
      return;
    }
    setCarrinho((c) => [...c, { produto: selecionado, quantidade: qtdNum }]);
    toast.success(`${selecionado.nome} adicionado`);
    setSelecionado(null);
    setQuantidade("");
    setBusca("");
  }

  function lerBalanca() {
    if (!config?.balanca_ativa) {
      toast.error("A balança não está conectada. Digite o peso manualmente.");
      return;
    }
    toast.error("Não foi possível ler a balança agora. Digite o peso manualmente.");
  }

  async function confirmarVenda() {
    if (carrinho.length === 0) return;
    if (forma === "dinheiro" && parseNum(recebido) < total) {
      toast.error("O valor recebido é menor que o total da venda.");
      return;
    }
    setSalvando(true);
    try {
      const { data: caixa } = await supabase
        .from("caixas")
        .select("id")
        .eq("status", "aberto")
        .order("aberto_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: venda, error } = await supabase
        .from("vendas")
        .insert({
          total,
          forma_pagamento: forma,
          valor_recebido: forma === "dinheiro" ? parseNum(recebido) : null,
          troco: forma === "dinheiro" ? troco : 0,
          caixa_id: caixa?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      const itens = carrinho.map((i) => ({
        venda_id: venda.id,
        produto_id: i.produto.id,
        nome_produto: i.produto.nome,
        unidade: i.produto.tipo_venda,
        quantidade: i.quantidade,
        preco_unitario: i.produto.preco_venda,
        custo_unitario: i.produto.preco_custo,
        subtotal: Number((i.quantidade * Number(i.produto.preco_venda)).toFixed(2)),
      }));
      const { error: erroItens } = await supabase.from("itens_venda").insert(itens);
      if (erroItens) throw erroItens;

      for (const i of carrinho) {
        await supabase.rpc("registrar_movimentacao_estoque", {
          p_produto: i.produto.id,
          p_tipo: "venda",
          p_quantidade: -i.quantidade,
          p_motivo: `Venda #${venda.numero}`,
        });
      }

      toast.success(`Venda finalizada: ${brl(total)}`);
      setCarrinho([]);
      setRecebido("");
      setPagando(false);
      setForma("dinheiro");
      qc.invalidateQueries();
    } catch {
      toast.error("Não foi possível finalizar a venda. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova venda</h1>
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto..."
            className="h-14 pl-12 text-lg"
          />
        </div>

        {selecionado && (
          <div className="mt-4 rounded-xl border-2 border-primary bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-2xl font-bold">{selecionado.nome}</p>
                <p className="text-base text-muted-foreground">
                  Preço: {brl(selecionado.preco_venda)}/{unidadeLabel(selecionado.tipo_venda)}
                </p>
              </div>
              {selecionado.tipo_venda === "kg" && (
                <Button variant="outline" className="h-12 text-base" onClick={lerBalanca}>
                  <Scale className="size-5" /> Ler balança
                </Button>
              )}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div className="w-48">
                <Label className="text-base">
                  {selecionado.tipo_venda === "kg" ? "Peso (kg)" : "Quantidade"}
                </Label>
                <Input
                  autoFocus
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && adicionar()}
                  placeholder={selecionado.tipo_venda === "kg" ? "1,350" : "2"}
                  className="mt-1 h-14 text-2xl font-semibold"
                  inputMode="decimal"
                />
              </div>
              <div>
                <p className="text-base text-muted-foreground">Total do item</p>
                <p className="text-3xl font-bold text-primary">
                  {brl(qtdNum * Number(selecionado.preco_venda))}
                </p>
              </div>
              <div className="ml-auto flex gap-3">
                <Button
                  variant="outline"
                  className="h-12 text-base"
                  onClick={() => {
                    setSelecionado(null);
                    setQuantidade("");
                  }}
                >
                  Cancelar
                </Button>
                <Button className="h-12 px-8 text-base font-semibold" onClick={adicionar}>
                  Adicionar
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelecionado(p);
                setQuantidade("");
              }}
              className="rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-all hover:border-primary hover:shadow-md"
            >
              <p className="text-lg font-semibold">{p.nome}</p>
              <p className="mt-1 text-base text-primary">
                {brl(p.preco_venda)} / {unidadeLabel(p.tipo_venda)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vendido por {p.tipo_venda === "kg" ? "peso" : p.tipo_venda}
              </p>
            </button>
          ))}
          {filtrados.length === 0 && (
            <p className="text-base text-muted-foreground">Nenhum produto encontrado.</p>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-8 lg:h-fit">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <ShoppingCart className="size-5" /> Venda atual
          </h2>

          {carrinho.length === 0 ? (
            <p className="mt-4 text-base text-muted-foreground">
              Escolha um produto para começar a venda.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {carrinho.map((i, idx) => (
                <li key={idx} className="flex items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-base font-medium">{i.produto.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {num(i.quantidade)} {unidadeLabel(i.produto.tipo_venda)} ×{" "}
                      {brl(i.produto.preco_venda)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold">
                      {brl(i.quantidade * Number(i.produto.preco_venda))}
                    </span>
                    <button
                      onClick={() => setCarrinho((c) => c.filter((_, k) => k !== idx))}
                      className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remover item"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-lg font-semibold">TOTAL</span>
            <span className="text-3xl font-bold text-primary">{brl(total)}</span>
          </div>

          <Button
            className="mt-4 h-16 w-full text-lg font-bold"
            disabled={carrinho.length === 0}
            onClick={() => setPagando(true)}
          >
            FINALIZAR VENDA
          </Button>
        </div>
      </div>

      <Dialog open={pagando} onOpenChange={setPagando}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">Como o cliente vai pagar?</DialogTitle>
          </DialogHeader>

          <p className="text-lg">
            Total da venda: <strong className="text-primary">{brl(total)}</strong>
          </p>

          <div className="grid grid-cols-2 gap-3">
            {FORMAS.map((f) => (
              <button
                key={f}
                onClick={() => setForma(f)}
                className={
                  "flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-5 text-base font-semibold transition-colors " +
                  (forma === f
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50")
                }
              >
                {forma === f && <Check className="size-5" />}
                {pagamentoLabel(f)}
              </button>
            ))}
          </div>

          {forma === "dinheiro" && (
            <div className="rounded-xl bg-secondary p-4">
              <Label className="text-base">Valor recebido</Label>
              <Input
                value={recebido}
                onChange={(e) => setRecebido(e.target.value)}
                placeholder="50,00"
                inputMode="decimal"
                className="mt-1 h-14 bg-card text-2xl font-semibold"
              />
              <p className="mt-3 text-lg">
                Troco: <strong className="text-primary">{brl(troco)}</strong>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="h-12 text-base"
              onClick={() => setPagando(false)}
            >
              Voltar
            </Button>
            <Button
              className="h-12 px-8 text-base font-bold"
              disabled={salvando}
              onClick={confirmarVenda}
            >
              {salvando ? "Salvando..." : "CONFIRMAR VENDA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}