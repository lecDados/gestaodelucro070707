export const brl = (v: number | string | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));

export const num = (v: number | string | null | undefined, casas = 3) =>
  new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas }).format(
    Number(v ?? 0),
  );

export const dataBR = (d: string | Date | null | undefined) => {
  if (!d) return "-";
  const dt = typeof d === "string" ? new Date(d.length === 10 ? d + "T12:00:00" : d) : d;
  return dt.toLocaleDateString("pt-BR");
};

export const horaBR = (d: string | Date | null | undefined) => {
  if (!d) return "-";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
};

export const unidadeLabel = (tipo: string) =>
  tipo === "kg" ? "kg" : tipo === "caixa" ? "cx" : "un";

export const pagamentoLabel = (p: string) =>
  ({ dinheiro: "Dinheiro", pix: "Pix", debito: "Cartão de débito", credito: "Cartão de crédito" })[
    p
  ] ?? p;

/** Converte texto digitado em número aceitando vírgula decimal. */
export const parseNum = (s: string) => {
  const v = Number(String(s).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};

export const inicioDoDia = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};