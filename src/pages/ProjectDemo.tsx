import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Icon from "../components/Icon";
import SmartLink from "../components/SmartLink";
import { loc, type DemoBloco, type Localized } from "../data";
import { useLang } from "../lang";
import { useProjects } from "../projectsStore";
import NotFound from "./NotFound";

export default function ProjectDemo() {
  const { slug } = useParams();
  const { t, lang } = useLang();
  const { projects, loading } = useProjects();
  const [copiado, setCopiado] = useState<string | null>(null);

  const project = projects.find((p) => p.slug === slug || p.id === slug);
  const demo = project?.demo_config ?? null;

  const copiar = (cmd: string) => {
    navigator.clipboard.writeText(cmd).then(
      () => {
        setCopiado(cmd);
        setTimeout(() => setCopiado((atual) => (atual === cmd ? null : atual)), 2000);
      },
      () => {}
    );
  };

  if (loading) return <main style={{ minHeight: "60vh" }} />;
  if (!project || !demo) return <NotFound />;

  const texto = (v: Localized) => loc(v, lang);

  const bloco = (c: DemoBloco, prefixo = "") => {
    const cmd = texto(c.cmd);
    const label = prefixo + texto(c.label);
    return <Bloco key={label} label={label} cmd={cmd} copiado={copiado === cmd} onCopy={() => copiar(cmd)} />;
  };

  return (
    <main style={{ animation: "fadeIn 380ms var(--ease-out)" }}>
      <div className="container" style={{ paddingTop: 28, paddingBottom: 8 }}>
        <Link
          to={`/projeto/${project.slug}`}
          className="mono"
          style={{ color: "var(--fg-3)", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-3)")}
        >
          <Icon name="chevronLeft" size={12} /> {t("voltar ao projeto", "back to project")}
        </Link>
      </div>

      <section style={{ padding: "24px 0 32px" }}>
        <div className="container">
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: project.accent }} />
            {demo.tipo === "embebido" ? texto(demo.etiqueta) : t("GUIA DE EXECUÇÃO", "EXECUTION GUIDE")}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
            <div>
              <h1 style={{ fontSize: "clamp(32px, 4vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 400, margin: 0 }}>
                {project.title} — {texto(demo.titulo)}
              </h1>
              <p style={{ fontSize: 16, color: "var(--fg-2)", lineHeight: 1.5, marginTop: 12, marginBottom: 0, maxWidth: 640 }}>
                {texto(demo.intro)}
              </p>
            </div>

            {project.github && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className="btn btn-primary" href={project.github} target="_blank" rel="noopener">
                  <Icon name="github" size={14} /> {t("GitHub Repositório", "GitHub Repository")}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container" style={{ marginBottom: 100 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {demo.tipo === "embebido" ? (
            <div>
              <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--bg-1)", boxShadow: "var(--shadow-1)" }}>
                <iframe
                  src={demo.url}
                  title={`${project.title} — ${texto(demo.titulo)}`}
                  allow="fullscreen"
                  style={{ display: "block", width: "100%", aspectRatio: "16 / 10", minHeight: 520, border: 0 }}
                />
              </div>
              <p className="mono" style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 12, marginBottom: 0 }}>
                {t("Pouco espaço? ", "Feeling cramped? ")}
                <SmartLink href={demo.url} style={{ color: "var(--accent)", textDecoration: "none" }}>
                  {t("abrir em ecrã inteiro", "open in full screen")}
                </SmartLink>
              </p>
            </div>
          ) : (
            <>
              {demo.passos.map((passo, i) => (
                <Passo
                  key={`${i}-${texto(passo.titulo)}`}
                  numero={i + 1}
                  cor={passo.cor}
                  titulo={texto(passo.titulo)}
                  descricao={texto(passo.descricao)}
                  minimoColuna={passo.minimoColuna ?? 300}
                >
                  {passo.blocos.map((b) => bloco(b))}
                </Passo>
              ))}

              {demo.fonte && (
                <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-lg)", background: "var(--bg-1)", padding: 24, boxShadow: "var(--shadow-1)" }}>
                  {bloco(demo.fonte, "💡 ")}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}

function Passo({ numero, cor, titulo, descricao, minimoColuna, children }: { numero: number; cor: string; titulo: string; descricao: string; minimoColuna: number; children: ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-lg)", background: "var(--bg-1)", padding: 28, boxShadow: "var(--shadow-1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `color-mix(in srgb, ${cor} 12%, transparent)`,
            color: cor,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {numero}
        </span>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>{titulo}</h2>
          <p style={{ color: "var(--fg-3)", fontSize: 14, margin: "4px 0 0" }}>{descricao}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${minimoColuna}px, 1fr))`, gap: 16, marginTop: 20 }}>
        {children}
      </div>
    </div>
  );
}

function Bloco({ label, cmd, copiado, onCopy }: { label: string; cmd: string; copiado: boolean; onCopy: () => void }) {
  const { t } = useLang();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "8px 12px", background: "var(--bg-2)", border: "1px solid var(--line)", borderBottom: "none", borderTopLeftRadius: "var(--r-md)", borderTopRightRadius: "var(--r-md)" }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{label}</span>
        <button
          onClick={onCopy}
          style={{ background: "none", border: "none", padding: 0, color: copiado ? "#27C93F" : "var(--accent)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
        >
          <Icon name={copiado ? "check" : "copy"} size={13} />
          {copiado ? t("Copiado!", "Copied!") : t("Copiar", "Copy")}
        </button>
      </div>
      <pre
        className="mono"
        style={{ margin: 0, padding: 14, background: "#030712", color: "#38BDF8", border: "1px solid var(--line)", borderBottomLeftRadius: "var(--r-md)", borderBottomRightRadius: "var(--r-md)", fontSize: 12, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap" }}
      >
        <code>{cmd}</code>
      </pre>
    </div>
  );
}
