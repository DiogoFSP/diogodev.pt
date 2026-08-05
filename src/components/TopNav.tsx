import { useEffect, useState, type CSSProperties } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cliqueSimples } from "../cliques";
import { useLang } from "../lang";
import Icon from "./Icon";
import LangToggle from "./LangToggle";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

function navLinkStyle({ isActive }: { isActive: boolean }): CSSProperties {
  return {
    position: "relative",
    padding: "8px 12px",
    color: isActive ? "var(--fg)" : "var(--fg-3)",
    textDecoration: "none",
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    transition: "color var(--t-fast) var(--ease-out)",
  };
}

// Sublinhado inset do link ativo (não ocupa o padding)
function ActiveLine() {
  return (
    <span
      style={{
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 2,
        height: 1,
        background: "var(--accent)",
      }}
    />
  );
}

function LinkSeccao({ id, label, ativo, aoAbrir }: { id: string; label: string; ativo: boolean; aoAbrir: (id: string) => void }) {
  const { pathname } = useLocation();
  const abrir = (e: React.MouseEvent) => {
    if (!cliqueSimples(e)) return;
    aoAbrir(id);
    const alvo = pathname === "/" ? document.getElementById(id) : null;
    if (alvo) {
      e.preventDefault();
      alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  return (
    <Link to={`/#${id}`} onClick={abrir} className="navlink hide-xs" style={navLinkStyle({ isActive: ativo })}>
      {ativo && <ActiveLine />}
      {label}
    </Link>
  );
}

export default function TopNav({ onPalette }: { onPalette?: () => void }) {
  const { t } = useLang();
  const { pathname, hash } = useLocation();
  const [seccao, setSeccao] = useState(() => (pathname === "/" ? hash.slice(1) : ""));

  useEffect(() => {
    setSeccao(pathname === "/" ? hash.slice(1) : "");
  }, [pathname, hash]);

  useEffect(() => {
    if (!seccao) return;
    const sair = () => setSeccao("");
    const opcoes = { passive: true, once: true } as const;
    window.addEventListener("wheel", sair, opcoes);
    window.addEventListener("touchmove", sair, opcoes);
    window.addEventListener("keydown", sair, { once: true });
    return () => {
      window.removeEventListener("wheel", sair);
      window.removeEventListener("touchmove", sair);
      window.removeEventListener("keydown", sair);
    };
  }, [seccao]);
  const trabalhosAtivo = !seccao || seccao === "work";

  // já na página inicial: sobe ao topo em vez de "navegar"
  const irParaTopo = (e: React.MouseEvent) => {
    if (pathname !== "/" || !cliqueSimples(e)) return;
    e.preventDefault();
    setSeccao("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const irParaTrabalhos = (e: React.MouseEvent) => {
    if (pathname !== "/" || !cliqueSimples(e)) return;
    const alvo = document.getElementById("work");
    if (!alvo) return;
    e.preventDefault();
    setSeccao("work");
    alvo.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // mostra a tecla certa conforme o sistema (⌘ é do Mac)
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        background: "var(--glass)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
        }}
      >
        <Link
          to="/"
          className="mono"
          style={{ color: "var(--fg)", textDecoration: "none", fontSize: 13 }}
          onClick={irParaTopo}
        >
          <Logo />
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <NavLink to="/" end className="navlink" onClick={irParaTrabalhos} style={({ isActive }) => navLinkStyle({ isActive: isActive && trabalhosAtivo })}>
            {({ isActive }) => (
              <>
                {isActive && trabalhosAtivo && <ActiveLine />}
                {t("trabalhos", "work")}
              </>
            )}
          </NavLink>
          <LinkSeccao id="percurso" label={t("percurso", "path")} ativo={seccao === "percurso"} aoAbrir={setSeccao} />
          <NavLink to="/sobre" className="navlink" style={navLinkStyle}>
            {({ isActive }) => (
              <>
                {isActive && <ActiveLine />}
                {t("sobre", "about")}
              </>
            )}
          </NavLink>
          <NavLink to="/contacto" className="navlink" style={navLinkStyle}>
            {({ isActive }) => (
              <>
                {isActive && <ActiveLine />}
                {t("contacto", "contact")}
              </>
            )}
          </NavLink>
        </nav>

        <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onPalette && (
            <button
              onClick={onPalette}
              className="mono hide-sm"
              title="Ctrl+K"
              style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: "7px 10px", cursor: "pointer", color: "var(--fg-3)", fontSize: 11 }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--line-strong)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--line)")}
            >
              <Icon name="search" size={12} />
              <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, border: "1px solid var(--line-strong)", background: "var(--bg-2)" }}>{isMac ? "⌘K" : "Ctrl K"}</span>
            </button>
          )}
          <LangToggle />
          <ThemeToggle />
          <a
            href="https://github.com/DiogoFSP"
            target="_blank"
            rel="noopener"
            className="btn btn-ghost hide-sm"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11, textDecoration: "none" }}
          >
            <Icon name="github" size={13} /> github
          </a>
        </div>
      </div>
    </header>
  );
}
