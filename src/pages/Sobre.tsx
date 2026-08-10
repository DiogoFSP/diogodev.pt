import { useNavigate } from "react-router-dom";
import CvButton from "../components/CvButton";
import Footer from "../components/Footer";
import Icon from "../components/Icon";
import Percurso from "../components/Percurso";
import { loc } from "../data";
import { useLang } from "../lang";
import { useTitulo } from "../seo";
import { useSobre } from "../sobre";

export default function Sobre() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { conteudo } = useSobre();
  useTitulo(t("Sobre", "About"));

  return (
    <main style={{ animation: "fadeIn 380ms var(--ease-out)" }}>
      <section style={{ padding: "100px 0 40px" }}>
        <div className="container">
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>
            /{t("sobre", "about")}
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 6.5vw, 88px)", lineHeight: 0.98, letterSpacing: "-0.03em", fontWeight: 300, margin: 0, maxWidth: 980, textWrap: "balance" }}>
            <span style={{ color: "var(--fg)" }}>Diogo</span>{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 400 }}>Pinto</em>.
          </h1>
          {loc(conteudo.intro, lang) && (
            <p style={{ fontSize: "clamp(16px, 1.4vw, 19px)", color: "var(--fg-2)", marginTop: 26, maxWidth: 720, lineHeight: 1.6, fontWeight: 300, textWrap: "pretty" }}>
              {loc(conteudo.intro, lang)}
            </p>
          )}
        </div>
      </section>

      <section style={{ padding: "20px 0 40px" }}>
        <div className="container contact-grid">
          <div style={{ fontSize: 16, lineHeight: 1.65, color: "var(--fg-2)", textWrap: "pretty" }}>
            {conteudo.bio.map((paragrafo, i) => (
              <p key={i} style={i === 0 ? { marginTop: 0 } : undefined}>{loc(paragrafo, lang)}</p>
            ))}
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {conteudo.disponivel.length > 0 && (
              <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20 }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--success)", boxShadow: "0 0 8px var(--success)", animation: "pulseSoft 2s ease-in-out infinite" }} />
                  {t("disponível para", "available for")}
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--fg-2)", lineHeight: 1.9 }}>
                  {conteudo.disponivel.map((d, i) => (
                    <li key={i}>{loc(d, lang)}</li>
                  ))}
                </ul>
              </div>
            )}

            {conteudo.resumo.length > 0 && (
              <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20 }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
                  {t("em resumo", "at a glance")}
                </div>
                <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                  {conteudo.resumo.map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                      <dt className="mono" style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{loc(r.rotulo, lang)}</dt>
                      <dd style={{ margin: 0, fontSize: 13, color: "var(--fg-2)", textAlign: "right" }}>{loc(r.valor, lang)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </aside>
        </div>
      </section>

      <Percurso />

      {conteudo.competencias.length > 0 && (
        <Seccao eyebrow={t("competências", "skills")} titulo={t("Com o que trabalho.", "What I work with.")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {conteudo.competencias.map((grupo, i) => (
              <div key={i}>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                  {loc(grupo.rotulo, lang)}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {grupo.itens.map((item) => (
                    <span key={item} className="tag">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Seccao>
      )}

      {conteudo.experiencia.length > 0 && (
        <Seccao eyebrow={t("experiência", "experience")} titulo={t("Onde já trabalhei.", "Where I've worked.")}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {conteudo.experiencia.map((e, i) => (
              <article key={i} style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 22 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--fg)" }}>
                    {e.empresa}
                    {loc(e.cargo, lang) && <span style={{ color: "var(--fg-3)", fontWeight: 300 }}> · {loc(e.cargo, lang)}</span>}
                  </h3>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-4)", whiteSpace: "nowrap" }}>{loc(e.meta, lang)}</span>
                </div>
                {e.pontos.length > 0 && (
                  <ul style={{ margin: "12px 0 0", paddingLeft: 18, fontSize: 14, color: "var(--fg-2)", lineHeight: 1.7 }}>
                    {e.pontos.map((p, j) => (
                      <li key={j}>{loc(p, lang)}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </Seccao>
      )}

      {conteudo.formacao.length > 0 && (
        <Seccao eyebrow={t("formação", "education")} titulo={t("Onde estudei.", "Where I studied.")}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {conteudo.formacao.map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 14,
                  flexWrap: "wrap",
                  padding: "16px 0",
                  borderTop: i === 0 ? "1px solid var(--line)" : "none",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <div style={{ fontSize: 15, color: "var(--fg)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {loc(f.curso, lang)}
                    {f.nota && <span className="tag accent">{f.nota}</span>}
                  </div>
                  {loc(f.escola, lang) && <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 4 }}>{loc(f.escola, lang)}</div>}
                </div>
                <span className="mono" style={{ fontSize: 11, color: "var(--fg-4)", whiteSpace: "nowrap" }}>{loc(f.meta, lang)}</span>
              </div>
            ))}
          </div>
        </Seccao>
      )}

      <section style={{ padding: "60px 0 20px" }}>
        <div className="container">
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "32px 28px" }}>
            <h2 style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.02em", margin: 0 }}>
              {t("Quer falar comigo?", "Want to talk?")}
            </h2>
            <p style={{ fontSize: 15, color: "var(--fg-2)", margin: "10px 0 0", maxWidth: 560, lineHeight: 1.6 }}>
              {t(
                "Respondo a todas as mensagens. O CV completo está disponível para descarregar em português e inglês.",
                "I reply to every message. The full CV is available to download in Portuguese and English."
              )}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap", alignItems: "center" }}>
              <button className="btn btn-primary" onClick={() => navigate("/contacto")}>
                <Icon name="arrowRight" size={14} /> {t("contactar", "get in touch")}
              </button>
              <CvButton />
              <button className="btn" onClick={() => navigate("/#work")}>
                <Icon name="layers" size={14} /> {t("ver projetos", "view projects")}
              </button>
              <a className="btn btn-ghost" href="https://www.linkedin.com/in/diogofspinto17/" target="_blank" rel="noopener">
                <Icon name="external" size={14} /> LinkedIn
              </a>
              <a className="btn btn-ghost" href="https://github.com/DiogoFSP" target="_blank" rel="noopener">
                <Icon name="github" size={14} /> GitHub
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

function Seccao({ eyebrow, titulo, children }: { eyebrow: string; titulo: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "40px 0" }}>
      <div className="container section-shell">
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            /{eyebrow}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.02em", margin: 0, textWrap: "balance" }}>{titulo}</h2>
        </div>
        <div>{children}</div>
      </div>
    </section>
  );
}
