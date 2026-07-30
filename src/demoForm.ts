import type { DemoConfig, Localized, Project } from "./data";

export type LocPair = { pt: string; en: string };

export function pickPt(v: Localized | undefined): string {
  if (v == null) return "";
  return typeof v === "object" ? (v.pt ?? v.en ?? "") : v;
}

export function toPair(v?: Localized): LocPair {
  return { pt: pickPt(v), en: v != null && typeof v === "object" ? (v.en ?? "") : "" };
}

// EN vazio ou igual ao PT grava como string única; senão grava bilingue
export function toLoc(p: LocPair): Localized {
  const pt = p.pt.trim();
  const en = p.en.trim();
  return en && en !== pt ? { pt, en } : pt;
}

export type DemoBlocoForm = { label: LocPair; cmd: LocPair };
export type DemoPassoForm = { cor: string; titulo: LocPair; descricao: LocPair; blocos: DemoBlocoForm[]; minimoColuna?: number };
export type DemoForm = {
  tipo: "nenhuma" | "embebido" | "guia";
  titulo: LocPair;
  intro: LocPair;
  etiqueta: LocPair;
  url: string;
  passos: DemoPassoForm[];
  fonte: DemoBlocoForm;
};

export const BLOCO_VAZIO = (): DemoBlocoForm => ({ label: { pt: "", en: "" }, cmd: { pt: "", en: "" } });

export const CORES_PASSO = ["#3498DB", "#27C93F", "#F39C12", "#9B59B6", "#E74C3C"];

export const PASSO_VAZIO = (i: number): DemoPassoForm => ({
  cor: CORES_PASSO[i % CORES_PASSO.length],
  titulo: { pt: "", en: "" },
  descricao: { pt: "", en: "" },
  blocos: [BLOCO_VAZIO()],
});

export function toDemoForm(d?: Project["demo_config"]): DemoForm {
  const vazio: DemoForm = {
    tipo: "nenhuma",
    titulo: { pt: "", en: "" },
    intro: { pt: "", en: "" },
    etiqueta: { pt: "", en: "" },
    url: "",
    passos: [],
    fonte: BLOCO_VAZIO(),
  };
  if (!d) return vazio;
  const comum = { ...vazio, tipo: d.tipo, titulo: toPair(d.titulo), intro: toPair(d.intro) };
  if (d.tipo === "embebido") return { ...comum, etiqueta: toPair(d.etiqueta), url: d.url };
  return {
    ...comum,
    passos: d.passos.map((p) => ({
      cor: p.cor,
      titulo: toPair(p.titulo),
      descricao: toPair(p.descricao),
      minimoColuna: p.minimoColuna,
      blocos: p.blocos.map((b) => ({ label: toPair(b.label), cmd: toPair(b.cmd) })),
    })),
    fonte: d.fonte ? { label: toPair(d.fonte.label), cmd: toPair(d.fonte.cmd) } : BLOCO_VAZIO(),
  };
}

export function fromDemoForm(f: DemoForm): DemoConfig | null {
  if (f.tipo === "nenhuma") return null;
  if (f.tipo === "embebido") {
    if (!f.url.trim()) return null;
    return {
      tipo: "embebido",
      etiqueta: toLoc(f.etiqueta),
      titulo: toLoc(f.titulo),
      intro: toLoc(f.intro),
      url: f.url.trim(),
    };
  }
  const passos = f.passos
    .map((p) => ({
      cor: p.cor,
      titulo: toLoc(p.titulo),
      descricao: toLoc(p.descricao),
      ...(p.minimoColuna ? { minimoColuna: p.minimoColuna } : {}),
      blocos: p.blocos
        .filter((b) => b.cmd.pt.trim())
        .map((b) => ({ label: toLoc(b.label), cmd: toLoc(b.cmd) })),
    }))
    .filter((p) => p.blocos.length > 0);
  if (passos.length === 0) return null;
  const fonte = f.fonte.cmd.pt.trim() ? { label: toLoc(f.fonte.label), cmd: toLoc(f.fonte.cmd) } : null;
  return { tipo: "guia", titulo: toLoc(f.titulo), intro: toLoc(f.intro), passos, fonte };
}
