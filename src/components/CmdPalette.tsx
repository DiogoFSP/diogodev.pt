import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProjects } from "../projectsStore";
import { useLang } from "../lang";
import { useCv, ROTULO_CV } from "../cv";
import { useTheme } from "../theme";
import { openSafeExternalUrl } from "../security/url";
import Icon from "./Icon";
import Terminal from "./Terminal";

type Item = {
  group: string;
  icon: string;
  label: string;
  kbd?: string;
  run: () => void;
};

type Props = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function CmdPalette({ open, setOpen }: Props) {
  const { t, lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { projects: allProjects } = useProjects();
  const { disponiveis: cvs } = useCv();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  // palavra que abriu o terminal; null = fechado
  const [terminal, setTerminal] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // só a navegação por teclado deve provocar auto-scroll da lista
  const navSource = useRef<"key" | "mouse">("key");

  // atalho global Ctrl/Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQ("");
      setIdx(0);
      setTerminal(null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // trava o scroll por trás do modal; o scroll é do <html>, e o padding compensa a barra que desaparece
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const barra = window.innerWidth - html.clientWidth;
    const antes = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: document.body.style.overflow,
      pad: document.body.style.paddingRight,
    };
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    if (barra > 0) document.body.style.paddingRight = `${barra}px`;
    return () => {
      html.style.overflow = antes.htmlOverflow;
      document.body.style.overflow = antes.bodyOverflow;
      document.body.style.paddingRight = antes.pad;
    };
  }, [open]);

  const goSection = (id: string) => {
    setOpen(false);
    if (pathname !== "/") {
      navigate("/");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 340);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const items = useMemo<Item[]>(() => {
    const nav: Item[] = [
      { group: t("navegação", "navigation"), icon: "code", label: `${t("ir para", "go to")} · ${t("trabalhos", "work")}`, run: () => goSection("work") },
      { group: t("navegação", "navigation"), icon: "layers", label: `${t("ir para", "go to")} · ${t("sobre", "about")}`, run: () => { setOpen(false); navigate("/sobre"); } },
      { group: t("navegação", "navigation"), icon: "edit", label: t("abrir formulário de contacto", "open contact form"), run: () => { setOpen(false); navigate("/contacto"); } },
    ];
    const projs: Item[] = allProjects
      .filter((p) => p.status !== "hidden")
      .map((p) => ({
        group: t("projetos", "projects"),
        icon: "zap",
        label: `${t("abrir", "open")} · ${p.title}`,
        run: () => { setOpen(false); navigate(`/projeto/${p.slug}`); },
      }));
    const actions: Item[] = [
      { group: t("ações", "actions"), icon: "spark", label: theme === "dark" ? t("mudar para modo claro", "switch to light mode") : t("mudar para modo escuro", "switch to dark mode"), run: () => toggleTheme() },
      { group: t("ações", "actions"), icon: "globe", label: lang === "pt" ? "switch to English" : "mudar para Português", run: () => setLang(lang === "pt" ? "en" : "pt") },
      ...cvs.map((cv) => ({
        group: t("ações", "actions"),
        icon: "download",
        label: cvs.length > 1
          ? t(`descarregar CV · ${ROTULO_CV[cv.lang].pt}`, `download CV · ${ROTULO_CV[cv.lang].en}`)
          : t("descarregar CV", "download CV"),
        run: () => { openSafeExternalUrl(cv.url); setOpen(false); },
      })),
      { group: t("ações", "actions"), icon: "command", label: t("abrir admin", "open admin"), run: () => { setOpen(false); navigate("/admin"); } },
    ];
    const links: Item[] = [
      { group: t("ligações", "links"), icon: "github", label: "GitHub", kbd: "↗", run: () => { window.open("https://github.com/DiogoFSP", "_blank", "noopener"); setOpen(false); } },
      { group: t("ligações", "links"), icon: "external", label: "LinkedIn", kbd: "↗", run: () => { window.open("https://www.linkedin.com/in/diogofspinto17/", "_blank", "noopener"); setOpen(false); } },
      { group: t("ligações", "links"), icon: "arrowUpRight", label: "Email · diogo@diogodev.pt", run: () => { window.location.href = "mailto:diogo@diogodev.pt"; setOpen(false); } },
    ];
    return [...nav, ...projs, ...actions, ...links];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, lang, theme, pathname, allProjects, cvs]);

  // pesquisa insensível a acentos
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const filtered = q.trim() ? items.filter((it) => norm(it.label + " " + it.group).includes(norm(q))) : items;

  useEffect(() => { setIdx(0); }, [q]);

  // qualquer uma destas palavras revela o terminal
  const sudo = ["sudo", "terminal", "cmd"].includes(q.trim().toLowerCase());

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); navSource.current = "key"; setIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); navSource.current = "key"; setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (sudo) setTerminal(q.trim().toLowerCase()); else filtered[idx]?.run(); }
    else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
  };

  // mantém a linha ativa visível (só via teclado)
  useEffect(() => {
    if (navSource.current !== "key") return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-idx="${idx}"]`);
    if (!list || !row) return;
    const rTop = row.offsetTop;
    const rBot = rTop + row.offsetHeight;
    if (rTop < list.scrollTop) list.scrollTop = rTop - 6;
    else if (rBot > list.scrollTop + list.clientHeight) list.scrollTop = rBot - list.clientHeight + 6;
  }, [idx]);

  if (!open) return null;

  let lastGroup: string | null = null;
  return (
    <div
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 400, background: "var(--scrim)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: terminal ? "6vh" : "16vh", paddingBottom: terminal ? "6vh" : 0, animation: "fadeIn 160ms var(--ease-out)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          // em modo terminal a caixa é maior
          width: terminal ? 980 : 580,
          maxWidth: terminal ? "94vw" : "92vw",
          background: "var(--bg-1)", border: "1px solid var(--line-strong)", borderRadius: "var(--r-xl)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.45)", overflow: "hidden", animation: "fadeUp 200ms var(--ease-out)",
        }}
      >
        {terminal ? (
          <Terminal gatilho={terminal} onSair={() => setOpen(false)} />
        ) : (
        <>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <Icon name="search" size={15} style={{ color: "var(--fg-3)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("escreve um comando ou pesquisa…", "type a command or search…")}
            style={{ flex: 1, background: "none", border: 0, outline: "none", color: "var(--fg)", fontFamily: "var(--font-display)", fontSize: 15 }}
          />
          <span className="mono" style={{ fontSize: 10, padding: "3px 7px", borderRadius: 4, border: "1px solid var(--line-strong)", color: "var(--fg-3)", background: "var(--bg-2)" }}>esc</span>
        </div>

        <div ref={listRef} style={{ maxHeight: 380, overflowY: "auto", padding: "8px 8px 10px" }}>
          {sudo && (
            <button
              onClick={() => setTerminal(q.trim().toLowerCase())}
              className="mono"
              style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "14px 12px", borderRadius: "var(--r-md)", border: 0, cursor: "pointer", textAlign: "left",
                background: "var(--bg-2)", color: "var(--fg)", boxShadow: "inset 2px 0 0 var(--accent)", fontSize: 13,
              }}
            >
              <Icon name="command" size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{t("abrir terminal", "open terminal")}</span>
              <span style={{ fontSize: 10, color: "var(--fg-4)" }}>↵</span>
            </button>
          )}
          {!sudo && filtered.length === 0 && (
            <div style={{ padding: "36px 0", textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>
              {t("sem resultados para", "no results for")} “{q}”
            </div>
          )}
          {!sudo && filtered.map((it, i) => {
            const showGroup = it.group !== lastGroup;
            lastGroup = it.group;
            const activeRow = i === idx;
            return (
              <Fragment key={it.label + i}>
                {showGroup && (
                  <div className="mono" style={{ fontSize: 9.5, color: "var(--fg-4)", letterSpacing: "0.14em", textTransform: "uppercase", padding: "12px 12px 6px" }}>{it.group}</div>
                )}
                <button
                  data-idx={i}
                  onClick={() => it.run()}
                  onMouseEnter={() => { navSource.current = "mouse"; setIdx(i); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "10px 12px", borderRadius: "var(--r-md)", border: 0, cursor: "pointer", textAlign: "left",
                    background: activeRow ? "var(--bg-2)" : "transparent",
                    color: activeRow ? "var(--fg)" : "var(--fg-2)",
                    boxShadow: activeRow ? "inset 2px 0 0 var(--accent)" : "none",
                    fontFamily: "var(--font-display)", fontSize: 13.5,
                  }}
                >
                  <Icon name={it.icon} size={14} style={{ color: activeRow ? "var(--accent)" : "var(--fg-3)", flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.kbd && <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)" }}>{it.kbd}</span>}
                  {activeRow && !it.kbd && <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)" }}>↵</span>}
                </button>
              </Fragment>
            );
          })}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
