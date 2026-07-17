import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "pt" | "en";

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (pt: string, en: string) => string;
}>({
  lang: "pt",
  setLang: () => {},
  t: (pt) => pt,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem("diogo-lang") as Lang) ?? "pt"
  );

  useEffect(() => {
    localStorage.setItem("diogo-lang", lang);
    document.documentElement.lang = lang;
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
