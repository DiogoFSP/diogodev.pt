import { Link } from "react-router-dom";
import { useLang } from "../lang";
import { lerMarcos, montarPercurso } from "../percurso";
import { useProjects, useSetting } from "../projectsStore";

export default function Percurso() {
  const { t, lang } = useLang();
  const { projects } = useProjects();
  const { value } = useSetting("percurso");

  const itens = montarPercurso(projects, lerMarcos(value), lang);
  if (itens.length === 0) return null;

  return (
    <section id="percurso" style={{ padding: "40px 0", scrollMarginTop: 80 }}>
      <div className="container section-shell">
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            /{t("percurso", "path")}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.02em", margin: 0, textWrap: "balance" }}>
            {t("Como cheguei aqui.", "How I got here.")}
          </h2>
        </div>

        <ol style={{ listStyle: "none", margin: 0, padding: 0, position: "relative" }}>
          {itens.map((item, i) => {
            const conteudo = (
              <>
                <span className="mono" style={{ fontSize: 12, color: "var(--fg-4)", minWidth: 72, paddingTop: 2 }}>{item.ano}</span>
                <span
                  aria-hidden
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 999,
                    flexShrink: 0,
                    marginTop: 6,
                    background: item.tipo === "projeto" ? item.accent : "var(--fg-4)",
                    outline: "3px solid var(--bg)",
                  }}
                />
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 15, color: "var(--fg)" }}>{item.titulo}</span>
                  {item.detalhe && (
                    <span className="mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{item.detalhe}</span>
                  )}
                </span>
              </>
            );

            return (
              <li key={`${item.ano}-${item.titulo}-${i}`} style={{ position: "relative" }}>
                {i < itens.length - 1 && (
                  <span
                    aria-hidden
                    style={{ position: "absolute", left: 76, top: 20, bottom: -8, width: 1, background: "var(--line)" }}
                  />
                )}
                {item.slug ? (
                  <Link
                    to={`/projeto/${item.slug}`}
                    style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "10px 8px", borderRadius: "var(--r-md)", textDecoration: "none", transition: "background 140ms var(--ease-out)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {conteudo}
                  </Link>
                ) : (
                  <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "10px 8px" }}>{conteudo}</div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
