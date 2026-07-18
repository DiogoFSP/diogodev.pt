import { useTheme } from "../theme";

// botão-ícone de largura fixa (não desloca o layout ao alternar)
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      title={theme === "dark" ? "Modo claro" : "Modo escuro"}
      aria-label="theme"
      className="btn btn-icon"
      style={{ color: "var(--fg-2)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-2)")}
    >
      {theme === "dark" ? <IconMoon /> : <IconSun />}
    </button>
  );
}

function IconSun() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
