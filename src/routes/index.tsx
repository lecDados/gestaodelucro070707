import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sistema da Quitanda — Vendas, estoque e caixa" },
      {
        name: "description",
        content:
          "Sistema simples para quitanda e hortifruti: vendas com balança, estoque, compras, perdas, caixa e relatórios.",
      },
      { property: "og:title", content: "Sistema da Quitanda" },
      {
        property: "og:description",
        content: "Vendas rápidas, estoque no controle e caixa fechado sem complicação.",
      },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/painel" });
  },
  component: () => null,
});
