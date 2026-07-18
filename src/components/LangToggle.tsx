import { useLang } from "../lang";

// pílula pt/en de largura fixa
export default function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div
      style={{
        display: "inline-flex",
        border: "1px solid var(--line)",
        borderRadius: 999,
        padding: 2,
        background: "var(--bg-1)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.04em",
      }}
    >
      {(["pt", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: "4px 10px",
            background: lang === l ? "var(--fg)" : "transparent",
            color: lang === l ? "var(--bg)" : "var(--fg-3)",
            border: 0,
            borderRadius: 999,
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "inherit",
            textTransform: "uppercase",
            transition: "all 160ms var(--ease-out)",
          }}
          onMouseEnter={(e) => {
            if (lang !== l) e.currentTarget.style.color = "var(--fg)";
          }}
          onMouseLeave={(e) => {
            if (lang !== l) e.currentTarget.style.color = "var(--fg-3)";
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
