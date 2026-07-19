import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Icon from "../components/Icon";
import { ProjectThumb } from "../components/thumbs";
import { loc, type Project } from "../data";
import { useProjects } from "../projectsStore";
import { useLang } from "../lang";

// ---------- Hero ----------

function Hero() {
  const { t, lang } = useLang();
  const navigate = useNavigate();

  // typewriter
  const full = "Diogo";
  const [text, setText] = useState("");
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setText(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <section style={{ padding: "120px 0 80px" }}>
      <div className="container">
        <div
          className="mono"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "var(--fg-3)",
            fontSize: 12,
            marginBottom: 28,
            animation: "fadeIn 600ms var(--ease-out)",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--success)", boxShadow: "0 0 10px var(--success)" }} />
          {t("disponível para projetos · 2026", "available for projects · 2026")}
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "clamp(56px, 8vw, 112px)",
            lineHeight: 0.96,
            letterSpacing: "-0.04em",
            fontWeight: 300,
            margin: 0,
            textWrap: "balance",
          }}
        >
          <span style={{ color: "var(--fg-3)" }}>{t("Olá, sou o", "Hi, I'm")}</span>{" "}
          <span style={{ color: "var(--fg)", fontWeight: 500 }} className="cursor">{text}</span>
        </h1>

        <p
          style={{
            marginTop: 32,
            fontSize: "clamp(18px, 1.6vw, 22px)",
            lineHeight: 1.45,
            color: "var(--fg-2)",
            maxWidth: 720,
            textWrap: "pretty",
            fontWeight: 300,
          }}
        >
          {lang === "en" ? (
            <>Computer Engineering student at ISEC, with prior training as an IT Technician — Systems. Focused on software development, with a growing interest in <span style={{ color: "var(--fg)" }}>artificial intelligence</span> applied to process optimization and to making technical work faster and smarter.</>
          ) : (
            <>Estudante de Engenharia Informática no ISEC, com formação prévia como Técnico de Informática — Sistemas. Foco em desenvolvimento de software, com interesse crescente em <span style={{ color: "var(--fg)" }}>inteligência artificial</span> aplicada à otimização de processos e à agilização do trabalho técnico.</>
          )}
        </p>

        <div style={{ display: "flex", gap: 40, marginTop: 56, flexWrap: "wrap", borderTop: "1px solid var(--line)", paddingTop: 28 }}>
          <Stat label={t("formação", "degree")} value={t("Eng.ª Informática (em curso)", "Computer Engineering (ongoing)")} />
          <Stat label={t("qualificação", "qualification")} value={t("Técnico de Informática — Sistemas", "IT Technician — Systems")} />
          <Stat label={t("interesses", "interests")} value={t("Desenvolvimento de software · IA aplicada", "Software development · Applied AI")} />
          <Stat label={t("atualmente", "currently")} value="Deep Sea Mining" />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 40, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-primary" onClick={() => navigate("/contacto")}>
            <Icon name="arrowRight" size={14} /> {t("contactar", "get in touch")}
          </button>
          <button className="btn" onClick={() => document.getElementById("work")?.scrollIntoView({ behavior: "smooth" })}>
            <Icon name="arrowDown" size={14} /> {t("ver projetos", "view projects")}
          </button>
          <a className="btn" href="https://www.linkedin.com/in/diogofspinto17/" target="_blank" rel="noopener">
            <Icon name="external" size={14} /> LinkedIn
          </a>
          <a className="btn" href={`${import.meta.env.BASE_URL}cv/Diogo-Pinto-CV.pdf`} download>
            <Icon name="download" size={14} /> {t("descarregar CV", "download CV")}
          </a>
          <a className="btn btn-ghost" href="https://github.com/DiogoFSP" target="_blank" rel="noopener">
            <Icon name="github" size={14} /> GitHub
          </a>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 14, color: "var(--fg)" }}>{value}</div>
    </div>
  );
}

// ---------- Grelha de projetos ----------

function ProjectsHeader({ count }: { count: number }) {
  const { t } = useLang();
  return (
    <div className="container" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, paddingTop: 60 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          {t("/trabalhos", "/work")} · {String(count).padStart(2, "0")} {t("projetos", "projects")}
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 400, letterSpacing: "-0.02em", margin: 0 }}>
          {t("O que construí.", "What I've built.")}
        </h2>
      </div>
    </div>
  );
}

// tamanhos: wide (2 colunas), tall (1 coluna x 2 linhas), small (1x1)
function BentoCard({ project, size, onOpen }: { project: Project; size: Project["featured"]; onOpen: () => void }) {
  const { lang } = useLang();
  const cardRef = useRef<HTMLElement>(null);
  const [hover, setHover] = useState(false);

  // posição do rato em variáveis CSS do cartão (evita re-renders)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  const sizeStyles = {
    wide: { gridColumn: "span 2", gridRow: "span 1", minHeight: 340 },
    tall: { gridColumn: "span 1", gridRow: "span 2", minHeight: 700 },
    small: { gridColumn: "span 1", gridRow: "span 1", minHeight: 340 },
  }[size];

  return (
    <article
      ref={cardRef}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onOpen}
      style={{
        ...sizeStyles,
        position: "relative",
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 280ms var(--ease-out), transform 280ms var(--ease-out), box-shadow 280ms var(--ease-out)",
        transform: hover ? "translateY(-2px)" : "none",
        borderColor: hover ? "var(--line-strong)" : "var(--line)",
        boxShadow: hover
          ? `0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px ${project.accent}33, 0 0 80px ${project.accent}22`
          : "var(--shadow-1)",
      }}
    >
      {/* glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), ${project.accent}14, transparent 50%)`,
          opacity: hover ? 1 : 0,
          transition: "opacity 280ms var(--ease-out)",
        }}
      />

      {/* miniatura */}
      <div style={{ position: "relative", flex: size === "tall" ? "1 1 60%" : "1 1 55%", minHeight: 0, overflow: "hidden", borderBottom: "1px solid var(--line)" }}>
        <div style={{ position: "absolute", inset: 0, transform: hover ? "scale(1.04)" : "scale(1)", transition: "transform 700ms var(--ease-out)" }}>
          <ProjectThumb id={project.id} image={project.image} alt={project.title} />
        </div>
        <div className="mono" style={{ position: "absolute", top: 12, left: 12, fontSize: 10, color: "var(--fg-2)", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8, background: "var(--glass)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid var(--line)", borderRadius: 6, padding: "4px 8px" }}>
          <span style={{ width: 4, height: 4, borderRadius: 999, background: project.accent }} />
          {project.year} · {loc(project.role, lang)}
        </div>
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 6 }}>
          {project.github && <QuickLink href={project.github} icon="github" label="repo" hover={hover} />}
          {project.demo && <QuickLink href={project.demo} icon="external" label="live" hover={hover} delay={60} />}
        </div>
      </div>

      {/* corpo */}
      <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        <h3
          style={{
            margin: 0,
            fontSize: size === "tall" ? 30 : 22,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {project.title}
          <Icon
            name="arrowUpRight"
            size={16}
            style={{
              color: hover ? "var(--fg)" : "var(--fg-3)",
              transform: hover ? "translate(2px, -2px)" : "none",
              transition: "transform 280ms var(--ease-out), color 280ms var(--ease-out)",
            }}
          />
        </h3>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--fg-2)", textWrap: "pretty" }}>
          {size === "tall" ? loc(project.summary, lang) : loc(project.tagline, lang)}
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {project.tags.slice(0, size === "tall" ? 6 : 4).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        {size !== "small" && project.metrics.length > 0 && (
          <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: `repeat(${project.metrics.length}, 1fr)`, gap: 12, paddingTop: 18, borderTop: "1px solid var(--line)" }}>
            {project.metrics.map((m, i) => (
              <div key={i}>
                <div className="mono" style={{ fontSize: 16, color: "var(--fg)", letterSpacing: "-0.02em" }}>{loc(m.value, lang)}</div>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{loc(m.label, lang)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function QuickLink({ href, icon, label, hover, delay = 0 }: { href: string; icon: string; label: string; hover: boolean; delay?: number }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      onClick={(e) => e.stopPropagation()}
      title={label}
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--glass)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        color: "var(--fg-2)",
        opacity: hover ? 1 : 0,
        transform: hover ? "translateY(0)" : "translateY(-4px)",
        transition: `opacity 220ms var(--ease-out) ${delay}ms, transform 220ms var(--ease-out) ${delay}ms, color 140ms var(--ease-out), border-color 140ms var(--ease-out)`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--fg)"; e.currentTarget.style.borderColor = "var(--fg-3)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-2)"; e.currentTarget.style.borderColor = "var(--line)"; }}
    >
      <Icon name={icon} size={14} />
    </a>
  );
}

// ---------- Sobre ----------

function AboutStrip() {
  const { t } = useLang();
  const navigate = useNavigate();
  return (
    <section id="about" style={{ padding: "140px 0 80px" }}>
      <div className="container about-grid">
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>/{t("sobre", "about")}</div>
          <h2 style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em", margin: 0 }}>{t("Sobre.", "About.")}</h2>
        </div>
        <div style={{ fontSize: 16, lineHeight: 1.6, color: "var(--fg-2)", textWrap: "pretty" }}>
          <p style={{ marginTop: 0 }}>
            {t(
              "Frequento Engenharia Informática no ISEC. Antes do percurso universitário concluí o curso Técnico de Informática — Sistemas, base que me permitiu chegar à licenciatura com fundamentos práticos já consolidados.",
              "I'm currently studying Computer Engineering at ISEC. Before university I completed the IT Technician course — Systems, a foundation that let me arrive at the degree with hands-on fundamentals already in place."
            )}
          </p>
          <p>
            {t(
              "O meu foco está no desenvolvimento de software, desde a modelação de dados até à interface final. Mais recentemente tenho dedicado tempo a explorar como ferramentas de inteligência artificial podem otimizar e agilizar o trabalho técnico do dia-a-dia — um campo que considero cada vez mais relevante e onde pretendo continuar a aprofundar conhecimento.",
              "My focus is on software development, from data modelling all the way to the final interface. Lately I've been exploring how AI tools can optimize and speed up day-to-day technical work — a field I find increasingly relevant and one I plan to keep going deeper into."
            )}
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => navigate("/contacto")}>
              <Icon name="arrowRight" size={14} /> {t("contactar", "get in touch")}
            </button>
            <a className="btn" href={`${import.meta.env.BASE_URL}cv/Diogo-Pinto-CV.pdf`} download>
              <Icon name="download" size={14} /> {t("descarregar CV", "download CV")}
            </a>
            <a className="btn btn-ghost" href="https://github.com/DiogoFSP" target="_blank" rel="noopener">
              <Icon name="github" size={14} /> github
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Página ----------

export default function Home() {
  const navigate = useNavigate();
  const { projects: all } = useProjects();
  const projects = all.filter((p) => p.status !== "hidden");

  return (
    <main>
      <Hero />
      <div id="work" style={{ scrollMarginTop: 80 }}>
        <ProjectsHeader count={projects.length} />
        <div className="container">
          <div className="projects-grid" style={{ "--cols": projects.length < 3 ? 2 : 3 } as React.CSSProperties}>
            {projects.map((p) => (
              <BentoCard key={p.id} project={p} size={p.featured} onOpen={() => navigate(`/projeto/${p.slug}`)} />
            ))}
          </div>
        </div>
      </div>
      <AboutStrip />
      <Footer />
    </main>
  );
}
