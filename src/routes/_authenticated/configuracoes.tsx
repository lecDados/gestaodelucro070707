import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: Configuracoes,
});

function Configuracoes() {
  const qc = useQueryClient();
  const [nomeLoja, setNomeLoja] = useState("");
  const [balancaAtiva, setBalancaAtiva] = useState(false);
  const [porta, setPorta] = useState("");

  const { data: config } = useQuery({
    queryKey: ["configuracoes"],
    queryFn: async () => {
      const { data } = await supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!config) return;
    setNomeLoja(config.nome_loja);
    setBalancaAtiva(config.balanca_ativa);
    setPorta(config.balanca_porta ?? "");
  }, [config]);

  async function salvar() {
    const { error } = await supabase.from("configuracoes").upsert({
      id: 1,
      nome_loja: nomeLoja || "Minha Quitanda",
      balanca_ativa: balancaAtiva,
      balanca_porta: porta || null,
    });
    if (error) {
      toast.error("Não foi possível salvar as configurações.");
      return;
    }
    toast.success("Configurações salvas!");
    qc.invalidateQueries({ queryKey: ["configuracoes"] });
  }

  return (
    <>
      <PageHeader titulo="Configurações" descricao="Nome da loja e ligação com a balança" />

      <div className="max-w-xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Sua loja</h2>
          <Label className="mt-4 block text-base">Nome da loja</Label>
          <Input
            value={nomeLoja}
            onChange={(e) => setNomeLoja(e.target.value)}
            className="mt-1 h-12 text-base"
            placeholder="Quitanda do Zé"
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-xl font-semibold">Balança</h2>
          <p className="mt-1 text-base text-muted-foreground">
            Se a balança estiver ligada ao computador, o peso aparece sozinho na tela de venda. Se
            não estiver, é só digitar o peso na mão.
          </p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <Label className="text-base">Usar balança conectada</Label>
            <Switch checked={balancaAtiva} onCheckedChange={setBalancaAtiva} />
          </div>
          {balancaAtiva && (
            <>
              <Label className="mt-4 block text-base">Porta da balança</Label>
              <Input
                value={porta}
                onChange={(e) => setPorta(e.target.value)}
                className="mt-1 h-12 text-base"
                placeholder="COM1"
              />
            </>
          )}
        </div>

        <Button className="h-14 w-full text-lg font-semibold" onClick={salvar}>
          Salvar configurações
        </Button>
      </div>
    </>
  );
}