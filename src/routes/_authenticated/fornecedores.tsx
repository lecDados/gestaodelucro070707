import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Fornecedor } from "@/lib/tipos";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  component: Fornecedores,
});

const vazio = { nome: "", telefone: "", documento: "", endereco: "", observacoes: "" };

function Fornecedores() {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState({ ...vazio });
  const [excluir, setExcluir] = useState<Fornecedor | null>(null);

  const { data: lista = [] } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data } = await supabase.from("fornecedores").select("*").order("nome");
      return (data ?? []) as Fornecedor[];
    },
  });

  async function salvar() {
    if (!form.nome.trim()) {
      toast.error("Informe o nome do fornecedor.");
      return;
    }
    const dados = {
      nome: form.nome.trim(),
      telefone: form.telefone || null,
      documento: form.documento || null,
      endereco: form.endereco || null,
      observacoes: form.observacoes || null,
    };
    const { error } = editando
      ? await supabase.from("fornecedores").update(dados).eq("id", editando)
      : await supabase.from("fornecedores").insert(dados);
    if (error) {
      toast.error("Não foi possível salvar o fornecedor.");
      return;
    }
    toast.success("Fornecedor salvo!");
    setAberto(false);
    qc.invalidateQueries({ queryKey: ["fornecedores"] });
  }

  async function apagar() {
    if (!excluir) return;
    const { error } = await supabase.from("fornecedores").delete().eq("id", excluir.id);
    setExcluir(null);
    if (error) {
      toast.error("Não foi possível excluir.");
      return;
    }
    toast.success("Fornecedor excluído.");
    qc.invalidateQueries({ queryKey: ["fornecedores"] });
  }

  return (
    <>
      <PageHeader
        titulo="Fornecedores"
        descricao="Quem entrega mercadoria na sua loja"
        acoes={
          <Button
            size="lg"
            className="h-12 text-base font-semibold"
            onClick={() => {
              setEditando(null);
              setForm({ ...vazio });
              setAberto(true);
            }}
          >
            <Plus className="size-5" /> Novo fornecedor
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((f) => (
          <div key={f.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <p className="text-lg font-semibold">{f.nome}</p>
            {f.telefone && <p className="mt-1 text-base">📞 {f.telefone}</p>}
            {f.documento && <p className="text-base text-muted-foreground">{f.documento}</p>}
            {f.endereco && <p className="text-base text-muted-foreground">{f.endereco}</p>}
            {f.observacoes && <p className="mt-2 text-sm text-muted-foreground">{f.observacoes}</p>}
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="text-base"
                onClick={() => {
                  setEditando(f.id);
                  setForm({
                    nome: f.nome,
                    telefone: f.telefone ?? "",
                    documento: f.documento ?? "",
                    endereco: f.endereco ?? "",
                    observacoes: f.observacoes ?? "",
                  });
                  setAberto(true);
                }}
              >
                <Pencil className="size-4" /> Editar
              </Button>
              <Button variant="outline" className="text-base" onClick={() => setExcluir(f)}>
                <Trash2 className="size-4" /> Excluir
              </Button>
            </div>
          </div>
        ))}
        {lista.length === 0 && (
          <p className="text-base text-muted-foreground">Nenhum fornecedor cadastrado ainda.</p>
        )}
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editando ? "Editar fornecedor" : "Novo fornecedor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base">Nome</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-base">Telefone</Label>
              <Input
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                className="mt-1 h-12 text-base"
                placeholder="(11) 90000-0000"
              />
            </div>
            <div>
              <Label className="text-base">CNPJ ou CPF</Label>
              <Input
                value={form.documento}
                onChange={(e) => setForm({ ...form, documento: e.target.value })}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-base">Endereço</Label>
              <Input
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                className="mt-1 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-base">Observações</Label>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                className="mt-1 text-base"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-12 text-base" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button className="h-12 px-8 text-base font-semibold" onClick={salvar}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Excluir fornecedor?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {excluir?.nome} será removido da lista. As compras já registradas continuam salvas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-base">Não, voltar</AlertDialogCancel>
            <AlertDialogAction className="text-base" onClick={apagar}>
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}