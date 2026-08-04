import { useMemo } from "react";
import { useSetting } from "./projectsStore";
import { sanitizeExternalUrl } from "./security/url";
import { useLang, type Lang } from "./lang";

export const CHAVE_CV: Record<Lang, string> = { pt: "cv_url_pt", en: "cv_url_en" };

export type CvDisponivel = { lang: Lang; url: string };

export const ROTULO_CV: Record<Lang, { pt: string; en: string }> = {
  pt: { pt: "português", en: "Portuguese" },
  en: { pt: "inglês", en: "English" },
};

export const NOME_CV: Record<Lang, string> = {
  pt: "CV-Diogo-Pinto-PT.pdf",
  en: "CV-Diogo-Pinto-EN.pdf",
};

export function comNomeDeFicheiro(url: string, lang: Lang): string {
  try {
    const alvo = new URL(url);
    alvo.searchParams.set("download", NOME_CV[lang]);
    return alvo.toString();
  } catch {
    return url;
  }
}

export function cvsDisponiveis(pt: string | null, en: string | null, lang: Lang): CvDisponivel[] {
  const urls: Record<Lang, string | null> = { pt, en };
  const ordem: Lang[] = lang === "en" ? ["en", "pt"] : ["pt", "en"];
  const lista: CvDisponivel[] = [];
  for (const l of ordem) {
    const bruto = urls[l];
    const url = bruto ? sanitizeExternalUrl(bruto) : null;
    if (url) lista.push({ lang: l, url: comNomeDeFicheiro(url, l) });
  }
  return lista;
}

export function escolherCv(lista: CvDisponivel[], pedido?: string): CvDisponivel | null {
  if (!lista.length) return null;
  if (!pedido) return lista[0];
  const alvo = pedido.trim().toLowerCase();
  if (alvo !== "pt" && alvo !== "en") return null;
  return lista.find((c) => c.lang === alvo) ?? null;
}

export function useCv() {
  const { lang } = useLang();
  const { value: pt } = useSetting(CHAVE_CV.pt);
  const { value: en } = useSetting(CHAVE_CV.en);

  const disponiveis = useMemo(() => cvsDisponiveis(pt, en, lang), [pt, en, lang]);

  return { disponiveis };
}
