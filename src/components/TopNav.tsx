import type { CSSProperties } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
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

export default function TopNav({ onPalette }: { onPalette?: () => void }) {
  const { t } = useLang();
  const { pathname } = useLocation();
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
          onClick={(e) => {
            // já na página inicial: sobe ao topo em vez de "navegar"
            if (pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <Logo />
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <NavLink to="/" end className="navlink" style={navLinkStyle}>
            {({ isActive }) => (
              <>
                {isActive && <ActiveLine />}
                {t("trabalhos", "work")}
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
