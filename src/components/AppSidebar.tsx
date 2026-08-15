import { Link } from "@tanstack/react-router";
import {
  Home,
  ShoppingCart,
  Package,
  BarChart3,
  Truck,
  Users,
  Wallet,
  TrendingDown,
  LineChart,
  Settings,
  Leaf,
} from "lucide-react";

const itens = [
  { to: "/painel", label: "Dashboard", icone: Home },
  { to: "/venda", label: "Nova venda", icone: ShoppingCart },
  { to: "/produtos", label: "Produtos", icone: Package },
  { to: "/estoque", label: "Estoque", icone: BarChart3 },
  { to: "/compras", label: "Compras", icone: Truck },
  { to: "/fornecedores", label: "Fornecedores", icone: Users },
  { to: "/caixa", label: "Caixa", icone: Wallet },
  { to: "/perdas", label: "Perdas", icone: TrendingDown },
  { to: "/relatorios", label: "Relatórios", icone: LineChart },
  { to: "/configuracoes", label: "Configurações", icone: Settings },
] as const;

export function AppSidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="rounded-xl bg-sidebar-primary p-2 text-sidebar-primary-foreground">
          <Leaf className="size-6" />
        </span>
        <div>
          <p className="text-lg font-bold leading-tight">Quitanda</p>
          <p className="text-sm opacity-70">Sistema de gestão</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {itens.map((i) => (
          <Link
            key={i.to}
            to={i.to}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors hover:bg-sidebar-accent"
            activeProps={{ className: "bg-sidebar-primary text-sidebar-primary-foreground" }}
          >
            <i.icone className="size-5 shrink-0" />
            {i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}