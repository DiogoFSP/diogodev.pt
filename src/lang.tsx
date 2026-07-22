import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "pt" | "en";

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (pt: string, en: string) => string;
}>({
  lang: "en",
  setLang: () => {},
  t: (_pt, en) => en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem("diogo-lang") as Lang) ?? "en"
  );

  useEffect(() => {
    localStorage.setItem("diogo-lang", lang);
    document.documentElement.lang = lang;

    // atualiza título e meta description conforme a língua
    const meta = lang === "en"
      ? {
          title: "Diogo Pinto — Software Developer | Computer Engineering @ ISEC",
          desc: "Portfolio of Diogo Pinto, Computer Engineering student at ISEC and IT Technician. Software development in Java, JavaFX and React, with an interest in artificial intelligence.",
        }
      : {
          title: "Diogo Pinto — Desenvolvedor de Software | Eng.ª Informática ISEC",
          desc: "Portfólio de Diogo Pinto, estudante de Engenharia Informática no ISEC e Técnico de Informática. Desenvolvimento de software em Java, JavaFX e React, com interesse em inteligência artificial.",
        };
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.desc);
    document.querySelector('meta[property="og:locale"]')?.setAttribute("content", lang === "en" ? "en_US" : "pt_PT");
  }, [lang]);

  const t = (pt: string, en: string) => (lang === "en" ? en : pt);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
