import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";
import { type Project } from "../data";
import {
  deleteMessage as deleteMessageRemote,
  deleteProject as deleteProjectRemote,
  fetchMessages,
  markAllMessagesRead,
  setMessageRead,
  upsertProject,
  useProjects,
  type Message,
} from "../projectsStore";
import { supabase, supabaseConfigured } from "../supabase";

// Admin: projetos e mensagens via projectsStore; auth Supabase quando
// configurado, senão fallback local.

const SUBJECT_LABELS: Record<string, string> = {
  geral: "Geral",
  estagio: "Estágio",
  projeto: "Projeto",
  outro: "Outro",
};

type View = "list" | "edit" | "new" | "messages";

// ---------- login ----------
// fallback local: hash SHA-256 das credenciais do .env.local
// (sem .env.local, ex. build de produção, o admin fica inacessível)
const ADMIN_EMAIL = String(import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase();
const ADMIN_HASH = String(import.meta.env.VITE_ADMIN_PASSWORD_HASH || "");
const SESSION_KEY = "diogo-admin-session";

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Admin() {
  // sessão: Supabase quando configurado, senão sessionStorage
  const [authed, setAuthed] = useState<boolean | null>(() =>
    supabaseConfigured ? null : sessionStorage.getItem(SESSION_KEY) === "1"
  );

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setAuthed(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (authed === null) return null; // a verificar a sessão do Supabase

  if (!authed) {
    return (
      <AdminLogin
        onSuccess={() => {
          if (!supabaseConfigured) {
            sessionStorage.setItem(SESSION_KEY, "1");
            setAuthed(true);
          }
          // no modo Supabase, o onAuthStateChange trata da entrada
        }}
      />
    );
  }
  return (
    <AdminPanel
      onLogout={async () => {
        if (supabase) await supabase.auth.signOut();
        else {
          sessionStorage.removeItem(SESSION_KEY);
          setAuthed(false);
        }
      }}
    />
  );
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checking) return;
    setChecking(true);
    setError(null);

    if (supabase) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setChecking(false);
      if (authError) setError("Email ou password incorretos.");
      else onSuccess();
      return;
    }

    if (!ADMIN_EMAIL || !ADMIN_HASH) {
      setChecking(false);
      setError("O admin não está configurado nesta instalação.");
      return;
    }
    const ok = email.trim().toLowerCase() === ADMIN_EMAIL && (await sha256Hex(password)) === ADMIN_HASH;
    setChecking(false);
    if (ok) onSuccess();
    else setError("Email ou password incorretos.");
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 220ms var(--ease-out)" }}>
      <form onSubmit={submit} style={{ width: 360, maxWidth: "90vw", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} className="mono">
          <Logo size={22} />
          <span style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>admin</span>
        </div>
        <AField label="email">
          <input className="input mono" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus autoComplete="username" />
        </AField>
        <AField label="password">
          <input className="input mono" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </AField>
        {error && <div style={{ color: "var(--danger)", fontSize: 12.5 }}>{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={checking} style={{ justifyContent: "center", opacity: checking ? 0.7 : 1 }}>
          <Icon name="arrowRight" size={14} /> entrar
        </button>
        <button type="button" className="btn btn-ghost mono" onClick={() => navigate("/")} style={{ justifyContent: "center", fontSize: 11 }}>
          <Icon name="chevronLeft" size={12} /> voltar ao site
        </button>
      </form>
    </div>
  );
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("list");
  const [editing, setEditing] = useState<Project | null>(null);
  const { projects, refresh } = useProjects();
  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    fetchMessages().then(setMessages).catch(() => setMessages([]));
  }, []);

  // atualiza backend e estado local em simultâneo
  const markRead = (id: number) => {
    setMessageRead(id, true).catch(() => {});
    setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, read: true } : m)));
  };
  const markAllRead = () => {
    markAllMessagesRead().catch(() => {});
    setMessages((ms) => ms.map((m) => ({ ...m, read: true })));
  };
  const deleteMsg = (id: number) => {
    deleteMessageRemote(id).catch(() => {});
    setMessages((ms) => ms.filter((m) => m.id !== id));
  };
  const unreadCount = messages.filter((m) => !m.read).length;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const startEdit = (p: Project) => { setEditing(p); setView("edit"); };
  const startNew = () => { setEditing(null); setView("new"); };

  const save = async (data: EditFormData) => {
    try {
      if (view === "new") {
        const np: Project = {
          id: data.slug,
          title: data.title,
          slug: data.slug,
          year: data.year,
          role: data.role,
          summary: data.summary,
          tagline: data.tagline,
          tags: data.tags,
          metrics: [],
          accent: "#E5E5E7",
          featured: "small",
          status: data.status,
          github: data.github || null,
          demo: data.demo || null,
          course: data.course,
        };
        await upsertProject(np);
        showToast(`Criado “${data.title}” · ${data.status === "hidden" ? "oculto" : "publicado"}`);
      } else if (editing) {
        await upsertProject({ ...editing, ...data, github: data.github || null, demo: data.demo || null });
        showToast(`Guardado “${data.title}”`);
      }
      refresh();
      setView("list");
    } catch {
      showToast("Não foi possível guardar — tenta de novo");
    }
  };

  const toggleVisibility = async (p: Project) => {
    const next = p.status === "hidden" ? "published" : "hidden";
    try {
      await upsertProject({ ...p, status: next });
      refresh();
      showToast(next === "hidden" ? `“${p.title}” agora oculto` : `“${p.title}” agora publicado`);
    } catch {
      showToast("Não foi possível alterar — tenta de novo");
    }
  };

  const remove = async (p: Project) => {
    if (!confirm(`Eliminar “${p.title}”? Esta ação não pode ser revertida.`)) return;
    try {
      await deleteProjectRemote(p.id);
      refresh();
      showToast(`Eliminado “${p.title}”`);
    } catch {
      showToast("Não foi possível eliminar — tenta de novo");
    }
  };

  const filtered = projects.filter((p) => {
    if (!showHidden && p.status === "hidden") return false;
    if (!search) return true;
    return (
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    );
  });
  const hiddenCount = projects.filter((p) => p.status === "hidden").length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", display: "flex", flexDirection: "column", animation: "fadeIn 220ms var(--ease-out)" }}>
      {/* chrome do topo */}
      <div style={{ background: "var(--bg-1)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", height: 52, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }} className="mono">
          <Logo size={22} />
          <span style={{ fontSize: 12, color: "var(--fg-4)" }}>
            admin / {view === "list" ? "projetos" : view === "new" ? "novo projeto" : view === "messages" ? "mensagens" : `a editar · ${editing?.slug}`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: supabaseConfigured ? "var(--success)" : "var(--warn)" }} />
            {supabaseConfigured ? "supabase · central" : "local · este browser"}
          </span>
          <ThemeToggle />
          <button className="btn btn-ghost mono" onClick={onLogout} style={{ fontSize: 11 }} title="fechar sessão do admin">
            terminar sessão
          </button>
          <button className="btn btn-ghost" onClick={() => navigate("/")}>
            <Icon name="close" size={14} /> sair
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", flex: 1, minHeight: 0 }}>
        {/* sidebar */}
        <aside style={{ background: "var(--bg-1)", borderRight: "1px solid var(--line)", padding: "24px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
          <SidebarItem icon="layers" label="projetos" count={projects.length} active={view === "list" || view === "edit" || view === "new"} onClick={() => setView("list")} />
          <SidebarItem icon="command" label="mensagens" count={unreadCount > 0 ? unreadCount : messages.length} highlight={unreadCount > 0} active={view === "messages"} onClick={() => setView("messages")} />

          <div style={{ marginTop: "auto", padding: 12, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
              {supabaseConfigured ? "ligado" : "a caminho"}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
              {supabaseConfigured
                ? <>Base de dados central ativa — as edições valem para todos os visitantes.</>
                : <>Login real e base de dados central chegam com o <span className="mono" style={{ color: "var(--accent)" }}>Supabase</span>.</>}
            </div>
          </div>
        </aside>

        {/* conteúdo */}
        <main style={{ overflow: "auto", padding: "32px 36px", background: "var(--bg)" }}>
          {view === "list" && (
            <ListView projects={filtered} totalCount={projects.length} hiddenCount={hiddenCount} showHidden={showHidden} setShowHidden={setShowHidden} search={search} setSearch={setSearch} onEdit={startEdit} onNew={startNew} onDelete={remove} onToggleVisibility={toggleVisibility} />
          )}
          {(view === "edit" || view === "new") && (
            <EditView project={editing} onSave={save} onCancel={() => setView("list")} isNew={view === "new"} />
          )}
          {view === "messages" && (
            <MessagesView messages={messages} onRead={markRead} onMarkAllRead={markAllRead} onDelete={deleteMsg} unreadCount={unreadCount} />
          )}
        </main>
      </div>

      {toast && (
        <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--bg-2)", border: "1px solid var(--line-strong)", borderRadius: "var(--r-md)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 12px 32px rgba(0,0,0,0.5)", animation: "fadeUp 220ms var(--ease-out)", fontSize: 13 }}>
          <Icon name="check" size={14} style={{ color: "var(--success)" }} /> {toast}
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, count, active, onClick, highlight }: { icon: string; label: string; count?: number; active: boolean; onClick: () => void; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "var(--r-sm)", cursor: "pointer", background: active ? "var(--bg-2)" : "transparent", border: 0, color: active ? "var(--fg)" : "var(--fg-2)", fontFamily: "var(--font-display)", fontSize: 13, transition: "background 140ms var(--ease-out), color 140ms var(--ease-out)" }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-2)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Icon name={icon} size={14} /> {label}
      </span>
      {count != null && count !== 0 && (
        highlight ? (
          <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: "var(--on-accent)", background: "var(--accent)", borderRadius: 999, minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{count}</span>
        ) : (
          <span className="mono" style={{ fontSize: 11, color: "var(--fg-4)" }}>{count}</span>
        )
      )}
    </button>
  );
}

// ---------- lista de projetos ----------

function ListView({ projects, totalCount, hiddenCount, showHidden, setShowHidden, search, setSearch, onEdit, onNew, onDelete, onToggleVisibility }: {
  projects: Project[]; totalCount: number; hiddenCount: number;
  showHidden: boolean; setShowHidden: (v: boolean) => void;
  search: string; setSearch: (v: string) => void;
  onEdit: (p: Project) => void; onNew: () => void; onDelete: (p: Project) => void;
  onToggleVisibility: (p: Project) => void;
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>/projetos</div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em" }}>
            {totalCount} projeto{totalCount === 1 ? "" : "s"}
            {hiddenCount > 0 && <span style={{ color: "var(--fg-3)", fontSize: 16, marginLeft: 12 }}>· {hiddenCount} oculto{hiddenCount === 1 ? "" : "s"}</span>}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <label
            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "8px 12px", border: `1px solid ${showHidden ? "var(--accent)" : "var(--line)"}`, borderRadius: "var(--r-md)", background: showHidden ? "var(--accent-soft)" : "var(--bg-1)" }}
            onClick={() => setShowHidden(!showHidden)}
          >
            <Icon name="eye" size={13} style={{ color: showHidden ? "var(--accent)" : "var(--fg-3)" }} />
            <span className="mono" style={{ fontSize: 11, color: showHidden ? "var(--fg)" : "var(--fg-3)" }}>
              {showHidden ? "a mostrar ocultos" : "mostrar ocultos"}
            </span>
          </label>
          <div style={{ position: "relative" }}>
            <Icon name="search" size={14} style={{ position: "absolute", left: 12, top: 12, color: "var(--fg-4)", pointerEvents: "none" }} />
            <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="procurar título ou tag…" style={{ paddingLeft: 36, width: 240, fontFamily: "var(--font-mono)", fontSize: 12 }} />
          </div>
          <button className="btn btn-primary" onClick={onNew}>
            <Icon name="plus" size={14} /> novo projeto
          </button>
        </div>
      </div>

      <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
        <div className="mono" style={{ display: "grid", gridTemplateColumns: "32px 2.4fr 1fr 1.4fr 0.9fr 110px", gap: 16, padding: "12px 18px", borderBottom: "1px solid var(--line)", color: "var(--fg-4)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          <span></span>
          <span>título</span>
          <span>ano · função</span>
          <span>stack</span>
          <span>estado</span>
          <span></span>
        </div>
        {projects.map((p, i) => (
          <ProjectRow key={p.id} project={p} onEdit={onEdit} onDelete={onDelete} onToggleVisibility={onToggleVisibility} last={i === projects.length - 1} />
        ))}
        {projects.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: "var(--fg-3)" }}>
            <div className="mono" style={{ fontSize: 12, marginBottom: 8 }}>sem resultados</div>
            <div style={{ fontSize: 14 }}>
              tenta outra pesquisa, ou <button onClick={() => setSearch("")} style={{ background: "none", border: 0, color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>limpar filtro</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function pickPt(v: Project["role"] | undefined): string {
  if (v == null) return "";
  return typeof v === "object" ? (v.pt ?? v.en ?? "") : v;
}

function ProjectRow({ project, onEdit, onDelete, onToggleVisibility, last }: { project: Project; onEdit: (p: Project) => void; onDelete: (p: Project) => void; onToggleVisibility: (p: Project) => void; last: boolean }) {
  const [hover, setHover] = useState(false);
  const isHidden = project.status === "hidden";
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onEdit(project)}
      style={{ display: "grid", gridTemplateColumns: "32px 2.4fr 1fr 1.4fr 0.9fr 110px", gap: 16, padding: "16px 18px", borderBottom: last ? "none" : "1px solid var(--line)", background: hover ? "var(--bg-2)" : "transparent", cursor: "pointer", alignItems: "center", transition: "background 120ms var(--ease-out)", opacity: isHidden ? 0.62 : 1 }}
    >
      <div style={{ width: 24, height: 24, borderRadius: 4, background: "var(--bg-2)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: project.accent, boxShadow: `0 0 8px ${project.accent}` }} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
          {project.title}
          {isHidden && <span className="mono" style={{ fontSize: 9, color: "var(--warn)", border: "1px solid var(--warn)", padding: "1px 5px", borderRadius: 3, letterSpacing: "0.08em", textTransform: "uppercase" }}>oculto</span>}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)" }}>{pickPt(project.tagline)}</div>
      </div>
      <div className="mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>{project.year} · {pickPt(project.role)}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {project.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
        {project.tags.length > 3 && <span className="mono" style={{ fontSize: 11, color: "var(--fg-4)", alignSelf: "center" }}>+{project.tags.length - 3}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: isHidden ? "var(--warn)" : "var(--success)" }} />
        <span className="mono" style={{ fontSize: 11, color: "var(--fg-2)" }}>{isHidden ? "oculto" : "publicado"}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, opacity: hover ? 1 : 0.5, transition: "opacity 140ms var(--ease-out)" }}>
        <button className="btn btn-icon" onClick={(e) => { e.stopPropagation(); onToggleVisibility(project); }} title={isHidden ? "publicar" : "ocultar"}>
          <Icon name="eye" size={13} />
        </button>
        <button className="btn btn-icon" onClick={(e) => { e.stopPropagation(); onEdit(project); }} title="editar">
          <Icon name="edit" size={13} />
        </button>
        <button
          className="btn btn-icon"
          onClick={(e) => { e.stopPropagation(); onDelete(project); }}
          title="eliminar"
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg)")}
        >
          <Icon name="trash" size={13} />
        </button>
      </div>
    </div>
  );
}

// ---------- formulário de edição ----------

type EditFormData = {
  title: string;
  slug: string;
  year: string;
  role: string;
  tagline: string;
  summary: string;
  tags: string[];
  github: string;
  demo: string;
  course: string;
  status: "published" | "hidden";
};

function EditView({ project, onSave, onCancel, isNew }: { project: Project | null; onSave: (d: EditFormData) => void; onCancel: () => void; isNew: boolean }) {
  const [form, setForm] = useState({
    title: project?.title || "",
    slug: project?.slug || "",
    year: project?.year || String(new Date().getFullYear()),
    role: pickPt(project?.role) || "Solo",
    tagline: pickPt(project?.tagline) || "",
    summary: pickPt(project?.summary) || "",
    tags: project?.tags?.join(", ") || "",
    github: project?.github || "",
    demo: project?.demo || "",
    course: pickPt(project?.course) || "",
    status: (project?.status || (isNew ? "hidden" : "published")) as "published" | "hidden",
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });

  const submit = () => {
    if (!form.title.trim()) return;
    const slug = form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    onSave({ ...form, slug, tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean) });
  };

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <button onClick={onCancel} className="mono" style={{ background: "none", border: 0, color: "var(--fg-3)", cursor: "pointer", fontSize: 12, padding: 0, display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <Icon name="chevronLeft" size={12} /> todos os projetos
          </button>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 12 }}>
            {isNew ? "Novo projeto" : `A editar · ${project?.title}`}
            {form.status === "hidden" && <span className="mono" style={{ fontSize: 11, color: "var(--warn)", border: "1px solid var(--warn)", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>oculto</span>}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={onCancel}>cancelar</button>
          <button className="btn btn-primary" onClick={submit}>
            <Icon name="check" size={14} /> {isNew ? (form.status === "hidden" ? "criar como rascunho" : "criar e publicar") : "guardar alterações"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <FormSection title="visibilidade">
            <VisibilityToggle value={form.status} onChange={(v) => update("status", v)} />
          </FormSection>

          <FormSection title="básicos">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <AField label="título">
                <input className="input" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Deep Sea Mining" />
              </AField>
              <AField label="ano">
                <input className="input mono" value={form.year} onChange={(e) => update("year", e.target.value)} placeholder="2026" />
              </AField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <AField label="slug" hint="auto se vazio">
                <input className="input mono" value={form.slug} onChange={(e) => update("slug", e.target.value)} placeholder={form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} />
              </AField>
              <AField label="função">
                <input className="input" value={form.role} onChange={(e) => update("role", e.target.value)} placeholder="Solo · Trabalho universitário" />
              </AField>
            </div>
            <AField label="cadeira / contexto" hint="opcional">
              <input className="input" value={form.course} onChange={(e) => update("course", e.target.value)} placeholder="Programação Avançada · ISEC" />
            </AField>
            <AField label="tagline" hint="uma linha, vista no cartão">
              <input className="input" value={form.tagline} onChange={(e) => update("tagline", e.target.value)} placeholder="Mergulha, recolhe, sobrevive…" />
            </AField>
            <AField label="resumo" hint="2–3 frases">
              <textarea className="textarea" value={form.summary} onChange={(e) => update("summary", e.target.value)} rows={4} style={{ fontFamily: "var(--font-display)", fontSize: 13 }} />
            </AField>
          </FormSection>

          <FormSection title="stack tecnológica">
            <AField label="tags" hint="separadas por vírgulas">
              <input className="input mono" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="Java, JavaFX, MVC" />
            </AField>
            {form.tags.trim() && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {form.tags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            )}
          </FormSection>

          <FormSection title="links">
            <AField label="github" icon="github">
              <input className="input mono" value={form.github} onChange={(e) => update("github", e.target.value)} placeholder="https://github.com/DiogoFSP/…" />
            </AField>
            <AField label="demo / live" icon="external">
              <input className="input mono" value={form.demo} onChange={(e) => update("demo", e.target.value)} placeholder="https://… (opcional)" />
            </AField>
          </FormSection>

          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", lineHeight: 1.6 }}>
            nota: os textos editados aqui ficam iguais em PT e EN; a edição
            bilingue e as miniaturas chegam com o Supabase.
          </div>
        </div>

        {/* pré-visualização do cartão */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>pré-visualização do cartão</div>
          <div style={{ background: "var(--bg-1)", border: `1px solid ${form.status === "hidden" ? "var(--warn)" : "var(--line)"}`, borderRadius: "var(--r-lg)", padding: 18, opacity: form.status === "hidden" ? 0.7 : 1 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
              <span>{form.year || "—"} · {form.role || "—"}</span>
              {form.status === "hidden" && <span style={{ color: "var(--warn)" }}>oculto</span>}
            </div>
            <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em" }}>{form.title || "Sem título"}</div>
            <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 6, marginBottom: 12 }}>{form.tagline || "—"}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {form.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 4).map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function VisibilityToggle({ value, onChange }: { value: "published" | "hidden"; onChange: (v: "published" | "hidden") => void }) {
  const opts = [
    { v: "published" as const, label: "Publicado", sub: "Visível na página inicial.", color: "var(--success)" },
    { v: "hidden" as const, label: "Oculto", sub: "Só visto por ti, no admin.", color: "var(--warn)" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {opts.map((o) => {
        const active = value === o.v;
        return (
          <button key={o.v} type="button" onClick={() => onChange(o.v)} style={{ background: active ? "var(--bg-2)" : "var(--bg-1)", border: `1px solid ${active ? o.color : "var(--line)"}`, borderRadius: "var(--r-md)", padding: 14, textAlign: "left", color: "var(--fg)", cursor: "pointer", transition: "all 140ms var(--ease-out)", boxShadow: active ? `0 0 0 3px ${o.color === "var(--success)" ? "rgba(110,231,168,0.13)" : "rgba(255,180,84,0.13)"}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: o.color, boxShadow: active ? `0 0 8px ${o.color}` : "none" }} />
              <span style={{ fontSize: 14, fontWeight: 500 }}>{o.label}</span>
              {active && <Icon name="check" size={13} style={{ marginLeft: "auto", color: o.color }} />}
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.4 }}>{o.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>{children}</div>
    </section>
  );
}

function AField({ label, hint, icon, children }: { label: string; hint?: string; icon?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--fg-2)", display: "flex", alignItems: "center", gap: 6 }}>
          {icon && <Icon name={icon} size={11} />} {label}
        </span>
        {hint && <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)" }}>{hint}</span>}
      </div>
      {children}
    </label>
  );
}

// ---------- inbox de mensagens ----------

function MessagesView({ messages, onRead, onMarkAllRead, onDelete, unreadCount }: { messages: Message[]; onRead: (id: number) => void; onMarkAllRead: () => void; onDelete: (id: number) => void; unreadCount: number }) {
  const [selectedId, setSelectedId] = useState<number | null>(messages[0]?.id ?? null);
  const [filter, setFilter] = useState<"todas" | "naoLidas">("todas");

  const list = filter === "naoLidas" ? messages.filter((m) => !m.read) : messages;
  const selected = messages.find((m) => m.id === selectedId) || null;

  const open = (m: Message) => {
    setSelectedId(m.id);
    if (!m.read) onRead(m.id);
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }) + " · " + d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>/mensagens</div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em" }}>
            {messages.length} mensage{messages.length === 1 ? "m" : "ns"}
            {unreadCount > 0 && <span style={{ color: "var(--accent)", fontSize: 16, marginLeft: 12 }}>· {unreadCount} por ler</span>}
          </h2>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <FilterPill active={filter === "todas"} onClick={() => setFilter("todas")}>todas · {messages.length}</FilterPill>
          <FilterPill active={filter === "naoLidas"} onClick={() => setFilter("naoLidas")}>por ler · {unreadCount}</FilterPill>
          {unreadCount > 0 && <button className="btn" onClick={onMarkAllRead}><Icon name="check" size={13} /> marcar todas lidas</button>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "var(--accent-soft)", border: "1px solid var(--accent)", borderRadius: "var(--r-md)", padding: "14px 16px", marginBottom: 20 }}>
        <Icon name="check" size={15} style={{ color: "var(--accent)", marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.55 }}>
          As mensagens novas chegam ao teu <strong style={{ color: "var(--fg)" }}>email</strong> (via Web3Forms).{" "}
          {supabaseConfigured
            ? <>Este é o <strong style={{ color: "var(--fg)" }}>arquivo central</strong> — todas as mensagens do formulário ficam aqui, acessíveis em qualquer dispositivo.</>
            : <>Esta lista mostra o histórico guardado <strong style={{ color: "var(--fg)" }}>neste browser</strong> — com o Supabase passa a ser um arquivo central.</>}
        </div>
      </div>

      {messages.length === 0 ? (
        <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "80px 20px", textAlign: "center" }}>
          <Icon name="command" size={24} style={{ color: "var(--fg-4)", marginBottom: 14 }} />
          <div style={{ fontSize: 15, color: "var(--fg-2)", marginBottom: 6 }}>Ainda não há mensagens neste browser.</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--fg-4)" }}>Envia uma pelo formulário de contacto e volta aqui.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, alignItems: "start" }}>
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
            {list.map((m, i) => {
              const active = m.id === selectedId;
              return (
                <button key={m.id} onClick={() => open(m)} style={{ display: "block", width: "100%", textAlign: "left", cursor: "pointer", padding: "16px 18px", border: 0, borderBottom: i < list.length - 1 ? "1px solid var(--line)" : "none", borderLeft: `2px solid ${active ? "var(--accent)" : "transparent"}`, background: active ? "var(--bg-2)" : "transparent", transition: "background 120ms var(--ease-out)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      {!m.read && <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--accent)", flexShrink: 0 }} />}
                      <span style={{ fontSize: 14, fontWeight: m.read ? 400 : 600, color: "var(--fg)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                    </span>
                    <span className="tag" style={{ flexShrink: 0 }}>{SUBJECT_LABELS[m.subject] || m.subject}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 4 }}>{m.message}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)" }}>{fmtDate(m.date)}</div>
                </button>
              );
            })}
            {list.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--fg-3)", fontSize: 13 }}>sem mensagens por ler</div>
            )}
          </div>

          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 28, position: "sticky", top: 0, minHeight: 320 }}>
            {selected ? (
              <MessageDetail
                key={selected.id}
                m={selected}
                fmtDate={fmtDate}
                onDelete={() => {
                  const id = selected.id;
                  onDelete(id);
                  setSelectedId(messages.filter((x) => x.id !== id)[0]?.id ?? null);
                }}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 280, color: "var(--fg-3)" }}>
                <Icon name="command" size={22} style={{ marginBottom: 12, color: "var(--fg-4)" }} />
                <div style={{ fontSize: 14 }}>Seleciona uma mensagem para ler.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="mono" style={{ fontSize: 11, padding: "7px 12px", borderRadius: 999, border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`, background: active ? "var(--accent-soft)" : "var(--bg-1)", color: active ? "var(--fg)" : "var(--fg-3)", cursor: "pointer", transition: "all 140ms var(--ease-out)" }}>
      {children}
    </button>
  );
}

function MessageDetail({ m, fmtDate, onDelete }: { m: Message; fmtDate: (iso: string) => string; onDelete: () => void }) {
  const [composing, setComposing] = useState(false);
  const [reply, setReply] = useState("");

  // mailto já endereçado e com o corpo preenchido
  const mailtoHref = `mailto:${m.email}?subject=${encodeURIComponent("Re: " + (SUBJECT_LABELS[m.subject] || "contacto"))}&body=${encodeURIComponent(reply)}`;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--line)" }}>
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>{m.name}</h3>
          <a href={`mailto:${m.email}`} className="mono" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
            {m.email} <Icon name="arrowUpRight" size={12} />
          </a>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className="tag accent">{SUBJECT_LABELS[m.subject] || m.subject}</span>
          <button
            className="btn btn-icon"
            title="eliminar"
            onClick={onDelete}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg)")}
          >
            <Icon name="trash" size={13} />
          </button>
        </div>
      </div>
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", marginBottom: 16 }}>{fmtDate(m.date)}</div>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--fg-2)", margin: 0, whiteSpace: "pre-wrap", textWrap: "pretty" }}>{m.message}</p>

      {!composing ? (
        <div style={{ marginTop: 28 }}>
          <button className="btn btn-primary" onClick={() => setComposing(true)}>
            <Icon name="arrowRight" size={14} /> responder
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 28, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>resposta para {m.email}</div>
          <textarea
            className="textarea"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={6}
            autoFocus
            style={{ minHeight: 130, fontFamily: "var(--font-display)", fontSize: 14, lineHeight: 1.55 }}
            placeholder={`Olá ${m.name.split(" ")[0]},\n\n…`}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}>
            <a className="btn btn-primary" href={mailtoHref}>
              <Icon name="external" size={14} /> abrir no meu email
            </a>
            <button className="btn btn-ghost" onClick={() => setComposing(false)}>cancelar</button>
            <span style={{ fontSize: 11, color: "var(--fg-4)", marginLeft: "auto", maxWidth: 280, lineHeight: 1.4 }}>
              abre o teu programa de email com a resposta pronta — envio direto do site chega com o Supabase
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
