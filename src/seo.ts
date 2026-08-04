import { useEffect } from "react";
import { useLang, type Lang } from "./lang";

export const TITULO_SITE: Record<Lang, string> = {
  pt: "Diogo Pinto — Desenvolvedor de Software | Eng.ª Informática ISEC",
  en: "Diogo Pinto — Software Developer | Computer Engineering @ ISEC",
};

export function montarTitulo(pagina: string | null | undefined, lang: Lang): string {
  const nome = pagina?.trim();
  return nome ? `${nome} — Diogo Pinto` : TITULO_SITE[lang];
}

export function useTitulo(pagina: string | null | undefined) {
  const { lang } = useLang();
  useEffect(() => {
    document.title = montarTitulo(pagina, lang);
  }, [pagina, lang]);
}
