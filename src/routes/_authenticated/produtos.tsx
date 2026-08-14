import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { brl, num, parseNum, unidadeLabel } from "@/lib/format";
import type { Categoria, Fornecedor, Produto } from "@/lib/tipos";

export const Route = createFileRoute("/_authenticated/produtos")({
  component: Produtos,
});

const vazio = {
  nome: "",
  categoria_id: "",
  fornecedor_id: "",
  tipo_venda: "kg",
  preco_custo: "",
  preco_venda: "",
  estoque_atual: "",
  estoque_minimo: "",
  ativo: true,
};

function Produtos() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState({ ...vazio });
  const [salvando, setSalvando] = useState(false);

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produtos").select("*").order("nome");
      if (error) throw error;
      return data as unknown as Produto[];
    },
  });
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data } = await supabase.from("categorias").select("*").order("nome");
      return (data ?? []) as Categoria[];
    },
  });
  const { data: fornecedores = [] } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data } = await supabase.from("fornecedores").select("*").order("nome");
      return (data ?? []) as Fornecedor[];
    },
  });

  const filtrados = useMemo(
    () => produtos.filter((p) => p.nome.toLowerCase().includes(busca.trim().toLowerCase())),
    [produtos, busca],
  );

  function novo() {
    setEditando(null);
    setForm({ ...vazio });
    setAberto(true);
  }

  function editar(p: Produto) {
    setEditando(p.id);
    setForm({
      nome: p.nome,
      categoria_id: p.categoria_id ?? "",
      fornecedor_id: p.fornecedor_id ?? "",
      tipo_venda: p.tipo_venda,
      preco_custo: String(p.preco_custo).replace(".", ","),
      preco_venda: String(p.preco_venda).replace(".", ","),
      estoque_atual: String(p.estoque_atual).replace(".", ","),
      estoque_minimo: String(p.estoque_minimo).replace(".", ","),
      ativo: p.ativo,
    });
    setAberto(true);
  }

  async function salvar() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do produto.");
      return;
    }
    setSalvando(true);
    const dados = {
      nome: form.nome.trim(),
      categoria_id: form.categoria_id || null,
      fornecedor_id: form.fornecedor_id || null,
      tipo_venda: form.tipo_venda,
      preco_custo: parseNum(form.preco_custo),
      preco_venda: parseNum(form.preco_venda),
      estoque_atual: parseNum(form.estoque_atual),
      estoque_minimo: parseNum(form.estoque_minimo),
      ativo: form.ativo,
    };
    const { error } = editando
      ? await supabase.from("produtos").update(dados).eq("id", editando)
      : await supabase.from("produtos").insert(dados);
    setSalvando(false);
    if (error) {
      toast.error("Não foi possível salvar o produto.");
      return;
    }
    toast.success(editando ? "Produto atualizado!" : "Produto cadastrado!");
    setAberto(false);
    qc.invalidateQueries();
  }

  return (
    <>
      <PageHeader
        titulo="Produtos"
        descricao="Cadastre e ajuste os produtos vendidos na loja"
        acoes={
          <Button size="lg" className="h-12 text-base font-semibold" onClick={novo}>
            <Plus className="size-5" /> Novo produto
          </Button>
        }
      />

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
              <th className="px-4 py-3 font-semibold">Vendido por</th>
              <th className="px-4 py-3 font-semibold">Custo</th>
              <th className="px-4 py-3 font-semibold">Venda</th>
              <th className="px-4 py-3 font-semibold">Estoque</th>
              <th className="px-4 py-3 font-semibold">Situação</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtrados.map((p) => (
              <tr key={p.id} className="hover:bg-muted/50">
                <td className="px-4 py-3 font-medium">{p.nome}</td>
                <td className="px-4 py-3">{p.tipo_venda === "kg" ? "Quilo" : p.tipo_venda === "caixa" ? "Caixa" : "Unidade"}</td>
                <td className="px-4 py-3">{brl(p.preco_custo)}</td>
                <td className="px-4 py-3 font-semibold text-primary">{brl(p.preco_venda)}</td>
                <td className="px-4 py-3">
                  {num(p.estoque_atual)} {unidadeLabel(p.tipo_venda)}
                </td>
                <td className="px-4 py-3">
                  {p.ativo ? (
                    <span className="rounded-full bg-success/15 px-3 py-1 text-sm font-medium text-success">
                      Ativo
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                      Inativo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" onClick={() => editar(p)} className="text-base">
                    <Pencil className="size-4" /> Editar
                  </Button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum produto encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editando ? "Editar produto" : "Novo produto"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-base">Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-1 h-12 text-base"
                placeholder="Tomate"
              />
            </div>
            <div>
              <Label className="text-base">Categoria</Label>
              <Select
                value={form.categoria_id}
                onValueChange={(v) => setForm({ ...form, categoria_id: v })}
              >
                <SelectTrigger className="mt-1 !h-12 text-base">
                  <SelectValue placeholder="Escolher" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-base">
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-base">Tipo de venda</Label>
              <Select
                value={form.tipo_venda}
                onValueChange={(v) => setForm({ ...form, tipo_venda: v })}
              >
                <SelectTrigger className="mt-1 !h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg" className="text-base">Por quilo (kg)</SelectItem>
                  <SelectItem value="unidade" className="text-base">Por unidade</SelectItem>
                  <SelectItem value="caixa" className="text-base">Por caixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-base">Preço de custo (R$)</Label>
              <Input
                value={form.preco_custo}
                onChange={(e) => setForm({ ...form, preco_custo: e.target.value })}
                className="mt-1 h-12 text-base"
                inputMode="decimal"
                placeholder="4,10"
              />
            </div>
            <div>
              <Label className="text-base">Preço de venda (R$)</Label>
              <Input
                value={form.preco_venda}
                onChange={(e) => setForm({ ...form, preco_venda: e.target.value })}
                className="mt-1 h-12 text-base"
                inputMode="decimal"
                placeholder="8,99"
              />
            </div>
            <div>
              <Label className="text-base">Estoque atual</Label>
              <Input
                value={form.estoque_atual}
                onChange={(e) => setForm({ ...form, estoque_atual: e.target.value })}
                className="mt-1 h-12 text-base"
                inputMode="decimal"
              />
            </div>
            <div>
              <Label className="text-base">Estoque mínimo</Label>
              <Input
                value={form.estoque_minimo}
                onChange={(e) => setForm({ ...form, estoque_minimo: e.target.value })}
                className="mt-1 h-12 text-base"
                inputMode="decimal"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-base">Fornecedor</Label>
              <Select
                value={form.fornecedor_id}
                onValueChange={(v) => setForm({ ...form, fornecedor_id: v })}
              >
                <SelectTrigger className="mt-1 !h-12 text-base">
                  <SelectValue placeholder="Escolher (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {fornecedores.map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-base">
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                checked={form.ativo}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
                id="ativo"
              />
              <Label htmlFor="ativo" className="text-base">
                Produto ativo (aparece na tela de venda)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="h-12 text-base" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button className="h-12 px-8 text-base font-semibold" disabled={salvando} onClick={salvar}>
              {salvando ? "Salvando..." : "Salvar produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}