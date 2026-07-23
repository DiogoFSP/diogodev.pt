import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Icon from "../components/Icon";
import { ProjectThumb } from "../components/thumbs";
import { loc, type Project as ProjectData } from "../data";
import { useProjects } from "../projectsStore";
import { useLang } from "../lang";

export default function Project() {
  const { slug } = useParams();
  const { t } = useLang();
  const { projects, loading } = useProjects();
  const project = projects.find((p) => p.slug === slug);

  // evita mostrar o 404 enquanto os dados carregam
  if (loading) return <main style={{ minHeight: "60vh" }} />;

  if (!project) {
    return (
      <main className="container" style={{ padding: "120px 0", textAlign: "center" }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--fg-4)", letterSpacing: "0.14em", marginBottom: 16 }}>404</div>
        <h1 style={{ fontSize: 40, fontWeight: 400, letterSpacing: "-0.02em", margin: 0 }}>
          {t("Projeto não encontrado.", "Project not found.")}
        </h1>
        <Link to="/" className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 24, color: "var(--accent)", textDecoration: "none", fontSize: 13 }}>
          <Icon name="chevronLeft" size={13} /> {t("voltar a /trabalhos", "back to /work")}
        </Link>
      </main>
    );
  }

  return (
    <main style={{ animation: "fadeIn 380ms var(--ease-out)" }}>
      {/* voltar */}
      <div className="container" style={{ paddingTop: 28, paddingBottom: 8 }}>
        <Link
          to="/"
          className="mono"
          style={{ color: "var(--fg-3)", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-3)")}
        >
          <Icon name="chevronLeft" size={12} /> {t("voltar a /trabalhos", "back to /work")}
        </Link>
      </div>

      <Header project={project} />
      <MetricsStrip project={project} />

      {project.story && <StorySection project={project} />}
      {project.build && <BuildSection project={project} />}
      {project.gallery && project.gallery.length > 0 && <GallerySection project={project} />}
      {project.team && <TeamStrip project={project} />}

      <UpNext current={project} />
      <Footer />
    </main>
  );
}

function Header({ project }: { project: ProjectData }) {
  const { t, lang } = useLang();
  return (
    <section style={{ padding: "32px 0 48px" }}>
      <div className="container project-hero">
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: project.accent }} />
            {project.year} · {loc(project.role, lang)}
            <span style={{ color: "var(--fg-3)" }}>· {loc(project.course, lang)}</span>
          </div>
          <h1 style={{ fontSize: "clamp(48px, 6vw, 88px)", lineHeight: 0.96, letterSpacing: "-0.04em", fontWeight: 400, margin: 0 }}>
            {project.title}
          </h1>
          <p style={{ fontSize: 20, color: "var(--fg-2)", lineHeight: 1.5, marginTop: 24, marginBottom: 0, textWrap: "pretty", maxWidth: 560 }}>
            {loc(project.summary, lang)}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 32, flexWrap: "wrap" }}>
            {project.demo && (
              project.demo.startsWith("/") ? (
                <Link className="btn btn-primary" to={project.demo}>
                  <Icon name="external" size={14} /> {t("ver demo", "open demo")}
                </Link>
              ) : (
                <a className="btn btn-primary" href={project.demo} target="_blank" rel="noopener">
                  <Icon name="external" size={14} /> {t("ver demo", "open demo")}
                </a>
              )
            )}
            {project.github && (
              <a className="btn" href={project.github} target="_blank" rel="noopener">
                <Icon name="github" size={14} /> {t("código no GitHub", "source on GitHub")}
              </a>
            )}
          </div>
        </div>

        {/* miniatura */}
        <div className="project-thumb" style={{ position: "relative", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--bg-1)" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <ProjectThumb id={project.id} image={project.image} alt={project.title} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(60% 60% at 80% 20%, ${project.accent}22, transparent 60%)`, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 12, left: 12, display: "flex", gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--bg-3)" }} />
            <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--bg-3)" }} />
            <span style={{ width: 9, height: 9, borderRadius: 999, background: "var(--bg-3)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

function MetricsStrip({ project }: { project: ProjectData }) {
  const { lang } = useLang();
  return (
    <div className="container" style={{ marginBottom: 64 }}>
      <div className="metrics-strip" style={{ "--cols": project.metrics.length + 1 } as React.CSSProperties}>
        {project.metrics.map((m, i) => (
          <div key={i} style={{ padding: "20px 24px", borderRight: "1px solid var(--line)" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{loc(m.label, lang)}</div>
            <div style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-0.02em" }}>{loc(m.value, lang)}</div>
          </div>
        ))}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>stack</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {project.tags.map((tg) => <span key={tg} className="tag">{tg}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="container" style={{ paddingBottom: 80 }}>
      <div className="section-shell">
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", position: "sticky", top: 100, alignSelf: "start" }}>
          {label}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function StorySection({ project }: { project: ProjectData }) {
  const { t, lang } = useLang();
  return (
    <SectionShell label={t("a história", "the story")}>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: -32, top: 8, bottom: 8, width: 1, background: "var(--line)" }} />
        {project.story!.map((step, i) => (
          <div key={i} style={{ position: "relative", marginBottom: i < project.story!.length - 1 ? 56 : 0 }}>
            <div style={{ position: "absolute", left: -38, top: 8, width: 13, height: 13, borderRadius: 999, background: "var(--bg)", border: `2px solid ${project.accent}`, boxShadow: `0 0 12px ${project.accent}66` }} />
            <div className="mono" style={{ fontSize: 10, color: project.accent, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>
              {loc(step.kind, lang)} · {String(i + 1).padStart(2, "0")}
            </div>
            <h3 style={{ fontSize: 26, fontWeight: 400, letterSpacing: "-0.02em", margin: "0 0 12px" }}>{loc(step.title, lang)}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--fg-2)", margin: 0, maxWidth: 640, textWrap: "pretty" }}>{loc(step.body, lang)}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function BuildSection({ project }: { project: ProjectData }) {
  const { t, lang } = useLang();
  return (
    <SectionShell label={t("como está feito", "how it's built")}>
      <div className="build-grid">
        {project.build!.map((b, i) => (
          <div key={i} className="hover-glow" style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "22px 24px" }}>
            <h3 style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", margin: "0 0 10px", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="layers" size={15} style={{ color: project.accent }} />
              {loc(b.title, lang)}
            </h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--fg-2)", margin: 0, textWrap: "pretty" }}>{loc(b.body, lang)}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function GallerySection({ project }: { project: ProjectData }) {
  const { t } = useLang();
  const images = project.gallery!;
  const [open, setOpen] = useState<number | null>(null);

  // navegação por teclado com o lightbox aberto
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, images.length]);

  return (
    <SectionShell label={t("galeria", "gallery")}>
      <div className="gallery-grid">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setOpen(i)}
            className="hover-glow"
            style={{ padding: 0, border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--bg-1)", cursor: "zoom-in", aspectRatio: "16 / 10" }}
            title={t("ampliar", "enlarge")}
          >
            <img src={src} alt={`${project.title} — ${i + 1}`} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", animation: "fadeIn 180ms var(--ease-out)" }}
        >
          <img
            src={images[open]}
            alt={`${project.title} — ${open + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "92vw", maxHeight: "86vh", objectFit: "contain", borderRadius: "var(--r-md)", cursor: "default" }}
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + images.length) % images.length); }}
                className="btn btn-icon"
                style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }}
                title={t("anterior", "previous")}
              >
                <Icon name="chevronLeft" size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % images.length); }}
                className="btn btn-icon"
                style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)" }}
                title={t("seguinte", "next")}
              >
                <Icon name="chevronLeft" size={16} style={{ transform: "rotate(180deg)" }} />
              </button>
            </>
          )}
          <div className="mono" style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "rgba(255,255,255,0.7)", letterSpacing: "0.1em" }}>
            {open + 1} / {images.length}
          </div>
        </div>
      )}
    </SectionShell>
  );
}

function TeamStrip({ project }: { project: ProjectData }) {
  const { t } = useLang();
  return (
    <SectionShell label={t("equipa", "team")}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {project.team!.map((name) => (
          <span key={name} className="tag" style={{ fontSize: 12, padding: "6px 12px" }}>
            {name}{name === "Diogo Pinto" ? " ·" : ""}{name === "Diogo Pinto" && <span style={{ color: "var(--accent)", marginLeft: 4 }}>{t("eu", "me")}</span>}
          </span>
        ))}
      </div>
    </SectionShell>
  );
}

function UpNext({ current }: { current: ProjectData }) {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { projects } = useProjects();
  const others = projects.filter((p) => p.id !== current.id && p.status !== "hidden");
  if (others.length === 0) return null;
  return (
    <section style={{ borderTop: "1px solid var(--line)", padding: "56px 0 8px" }}>
      <div className="container">
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
          {t("a seguir", "up next")}
        </div>
        {others.map((p) => {
          return (
            <article
              key={p.id}
              onClick={() => navigate(`/projeto/${p.slug}`)}
              className="hover-glow upnext-row"
              style={{ padding: 16, border: "1px solid var(--line)", borderRadius: "var(--r-lg)", background: "var(--bg-1)", cursor: "pointer", marginBottom: 12 }}
            >
              <div style={{ height: 80, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--line)" }}>
                <ProjectThumb id={p.id} image={p.image} alt={p.title} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 500, letterSpacing: "-0.01em" }}>{p.title}</h3>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--fg-2)" }}>{loc(p.tagline, lang)}</p>
              </div>
              <Icon name="arrowRight" size={18} style={{ color: "var(--fg-3)", marginRight: 8 }} />
            </article>
          );
        })}
      </div>
    </section>
  );
}
