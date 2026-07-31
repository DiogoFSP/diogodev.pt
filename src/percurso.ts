import { loc, type Localized, type Project } from "./data";
import type { Lang } from "./lang";

export type Marco = { ano: Localized; titulo: Localized; detalhe: Localized };

export type ItemPercurso = {
  ano: string;
  titulo: string;
  detalhe: string;
  tipo: "marco" | "projeto";
  slug?: string;
  accent?: string;
};

export function lerMarcos(bruto: string | null): Marco[] {
  if (!bruto) return [];
  try {
    const lista = JSON.parse(bruto);
    if (!Array.isArray(lista)) return [];
    return lista.filter((m) => m && rotuloValido(m.ano));
  } catch {
    return [];
  }
}

function rotuloValido(ano: unknown): boolean {
  if (typeof ano === "string") return ano.trim().length > 0;
  if (ano && typeof ano === "object") {
    const par = ano as { pt?: string; en?: string };
    return Boolean(par.pt?.trim() || par.en?.trim());
  }
  return false;
}

export function anoInicial(ano: string): number {
  return Number(ano.match(/\d{4}/)?.[0] ?? 0);
}

export function montarPercurso(projetos: Project[], marcos: Marco[], lang: Lang): ItemPercurso[] {
  const doProjeto = projetos
    .filter((p) => p.status !== "hidden")
    .map<ItemPercurso>((p) => ({
      ano: p.year,
      titulo: p.title,
      detalhe: loc(p.course, lang),
      tipo: "projeto",
      slug: p.slug,
      accent: p.accent,
    }));

  const doMarco = marcos.map<ItemPercurso>((m) => ({
    ano: loc(m.ano, lang),
    titulo: loc(m.titulo, lang),
    detalhe: loc(m.detalhe, lang),
    tipo: "marco",
  }));

  return [...doMarco, ...doProjeto].sort((a, b) => {
    const diff = anoInicial(b.ano) - anoInicial(a.ano);
    if (diff !== 0) return diff;
    if (a.tipo !== b.tipo) return a.tipo === "marco" ? -1 : 1;
    return 0;
  });
}
