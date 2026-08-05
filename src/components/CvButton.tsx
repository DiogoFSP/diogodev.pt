import { useEffect, useRef, useState } from "react";
import { useLang } from "../lang";
import { useCv, ROTULO_CV } from "../cv";
import Icon from "./Icon";

export default function CvButton() {
  const { t } = useLang();
  const { disponiveis } = useCv();
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const clicouFora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    const carregouEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", clicouFora);
    document.addEventListener("keydown", carregouEsc);
    return () => {
      document.removeEventListener("mousedown", clicouFora);
      document.removeEventListener("keydown", carregouEsc);
    };
  }, [aberto]);

  if (!disponiveis.length) return null;
  const rotulo = t("descarregar CV", "download CV");

  if (disponiveis.length === 1) {
    return (
      <a className="btn" href={disponiveis[0].url} target="_blank" rel="noopener noreferrer">
        <Icon name="download" size={14} /> {rotulo}
      </a>
    );
  }

  return (
    <div ref={caixa} style={{ position: "relative" }}>
      <button
        type="button"
        className="btn"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((o) => !o)}
      >
        <Icon name="download" size={14} /> {rotulo}
        <Icon
          name="chevronRight"
          size={12}
          style={{ transform: aberto ? "rotate(-90deg)" : "rotate(90deg)", transition: "transform 160ms var(--ease-out)" }}
        />
      </button>
      {aberto && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: "100%",
            zIndex: 20,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: "var(--r-md)",
            boxShadow: "var(--shadow-1)",
            padding: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {disponiveis.map((cv) => (
            <a
              key={cv.lang}
              role="menuitem"
              href={cv.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAberto(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                padding: "7px 10px",
                borderRadius: "var(--r-sm)",
                color: "var(--fg-2)",
                fontSize: 13,
                whiteSpace: "nowrap",
                transition: "background 120ms var(--ease-out), color 120ms var(--ease-out)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-2)";
                e.currentTarget.style.color = "var(--fg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--fg-2)";
              }}
            >
              {t(ROTULO_CV[cv.lang].pt, ROTULO_CV[cv.lang].en)}
              <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {cv.lang}
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
