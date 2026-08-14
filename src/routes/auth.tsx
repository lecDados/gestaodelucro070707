import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Sistema da Quitanda" },
      {
        name: "description",
        content: "Acesse o sistema de gestão da sua quitanda: vendas, estoque, caixa e relatórios.",
      },
      { property: "og:title", content: "Entrar — Sistema da Quitanda" },
      {
        property: "og:description",
        content: "Acesse o sistema de gestão da sua quitanda: vendas, estoque, caixa e relatórios.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.navigate({ to: "/painel" });
    });
  }, [router]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        toast.success("Bem-vindo!");
        router.navigate({ to: "/painel" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { data: { nome }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Conta criada!");
          router.navigate({ to: "/painel" });
        } else {
          toast.success("Conta criada. Confirme o e-mail para entrar.");
          setModo("entrar");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        msg.includes("Invalid login")
          ? "E-mail ou senha incorretos."
          : msg.includes("already registered")
            ? "Este e-mail já tem conta. Faça login."
            : "Não foi possível continuar. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="rounded-2xl bg-primary p-3 text-primary-foreground">
            <Leaf className="size-8" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Sistema da Quitanda</h1>
          <p className="mt-1 text-base text-muted-foreground">
            {modo === "entrar" ? "Entre para começar o dia" : "Crie o acesso do seu computador"}
          </p>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          {modo === "criar" && (
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-base">
                Seu nome
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                className="h-12 text-base"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="senha" className="text-base">
              Senha
            </Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              className="h-12 text-base"
            />
          </div>
          <Button type="submit" disabled={carregando} className="h-12 w-full text-base font-semibold">
            {carregando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          className="mt-5 w-full text-base text-primary underline-offset-4 hover:underline"
        >
          {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}