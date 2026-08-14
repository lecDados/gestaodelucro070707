import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  titulo,
  valor,
  detalhe,
  icone: Icone,
  tom = "padrao",
}: {
  titulo: string;
  valor: string;
  detalhe?: string;
  icone: LucideIcon;
  tom?: "padrao" | "positivo" | "alerta" | "perigo";
}) {
  const tons = {
    padrao: "bg-secondary text-secondary-foreground",
    positivo: "bg-success/15 text-success",
    alerta: "bg-warning/20 text-accent-foreground",
    perigo: "bg-destructive/15 text-destructive",
  } as const;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-medium text-muted-foreground">{titulo}</p>
        <span className={cn("rounded-lg p-2", tons[tom])}>
          <Icone className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{valor}</p>
      {detalhe && <p className="mt-1 text-sm text-muted-foreground">{detalhe}</p>}
    </div>
  );
}