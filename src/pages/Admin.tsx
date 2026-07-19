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
  fetchPageViews,
  fetchTotalViews,
  markAllMessagesRead,
  saveProjectOrder,
  setMessageRead,
  setSetting,
  type PageView,
  uploadThumb,
  upsertProject,
  useProjects,
  useSetting,
  type Message,
} from "../projectsStore";
import { ProjectThumb } from "../components/thumbs";
import { supabase, supabaseConfigured } from "../supabase";

// Admin: projetos e mensagens via projectsStore; auth Supabase quando
// configurado, senão fallback local.

const SUBJECT_LABELS: Record<string, string> = {
  geral: "Geral",
  estagio: "Estágio",
  projeto: "Projeto",
  outro: "Outro",
};

type View = "list" | "edit" | "new" | "messages" | "cv" | "stats";

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
          metrics: data.metrics,
          accent: data.accent,
          featured: data.featured,
          status: data.status,
          github: data.github || null,
          demo: data.demo || null,
          course: data.course,
          image: data.image,
          gallery: data.gallery,
          team: data.team,
          story: data.story,
          build: data.build,
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
      showToast("Não foi possível guardar — tentar novamente");
    }
  };

  const toggleVisibility = async (p: Project) => {
    const next = p.status === "hidden" ? "published" : "hidden";
    try {
      await upsertProject({ ...p, status: next });
      refresh();
      showToast(next === "hidden" ? `“${p.title}” agora oculto` : `“${p.title}” agora publicado`);
    } catch {
      showToast("Não foi possível alterar — tentar novamente");
    }
  };

  // troca o projeto com o vizinho e grava a ordem completa (position = índice)
  const move = async (p: Project, dir: -1 | 1) => {
    const i = projects.findIndex((x) => x.id === p.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= projects.length) return;
    const next = [...projects];
    [next[i], next[j]] = [next[j], next[i]];
    try {
      await saveProjectOrder(next);
      refresh();
    } catch {
      showToast("Não foi possível reordenar — tentar novamente");
    }
  };

  const remove = async (p: Project) => {
    if (!confirm(`Eliminar “${p.title}”? Esta ação não pode ser revertida.`)) return;
    try {
      await deleteProjectRemote(p.id);
      refresh();
      showToast(`Eliminado “${p.title}”`);
    } catch {
      showToast("Não foi possível eliminar — tentar novamente");
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
            admin / {view === "list" ? "projetos" : view === "new" ? "novo projeto" : view === "messages" ? "mensagens" : view === "cv" ? "cv" : view === "stats" ? "estatísticas" : `a editar · ${editing?.slug}`}
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
          <SidebarItem icon="download" label="cv" active={view === "cv"} onClick={() => setView("cv")} />
          <SidebarItem icon="zap" label="estatísticas" active={view === "stats"} onClick={() => setView("stats")} />

          <DbStatus projects={projects.length} messages={messages.length} unread={unreadCount} />
        </aside>

        {/* conteúdo */}
        <main style={{ overflow: "auto", padding: "32px 36px", background: "var(--bg)" }}>
          {view === "list" && (
            <ListView projects={filtered} totalCount={projects.length} hiddenCount={hiddenCount} showHidden={showHidden} setShowHidden={setShowHidden} search={search} setSearch={setSearch} onEdit={startEdit} onNew={startNew} onDelete={remove} onToggleVisibility={toggleVisibility} onMove={move} canReorder={!search} />
          )}
          {(view === "edit" || view === "new") && (
            <EditView project={editing} onSave={save} onCancel={() => setView("list")} isNew={view === "new"} />
          )}
          {view === "messages" && (
            <MessagesView messages={messages} onRead={markRead} onMarkAllRead={markAllRead} onDelete={deleteMsg} unreadCount={unreadCount} />
          )}
          {view === "cv" && <CvView />}
          {view === "stats" && <StatsView />}
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

// ---------- estatísticas ----------

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function StatsView() {
  const [total, setTotal] = useState<number | null>(null);
  const [views, setViews] = useState<PageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    Promise.all([fetchTotalViews(), fetchPageViews(30)])
      .then(([t, v]) => { if (alive) { setTotal(t); setViews(v); } })
      .catch(() => { if (alive) setError(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tick]);

  // agregações: por dia (14 dias), últimos 7 dias, hoje e páginas mais vistas
  const days: { key: string; label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ key: dayKey(d), label: String(d.getDate()), count: 0 });
  }
  const byDay = new Map(days.map((d) => [d.key, d]));
  const todayKey = dayKey(new Date());
  const since7 = Date.now() - 7 * 86400000;
  let last7 = 0;
  let today = 0;
  const byPath = new Map<string, number>();
  for (const v of views) {
    const dt = new Date(v.created_at);
    const slot = byDay.get(dayKey(dt));
    if (slot) slot.count++;
    if (dt.getTime() >= since7) last7++;
    if (dayKey(dt) === todayKey) today++;
    byPath.set(v.path, (byPath.get(v.path) || 0) + 1);
  }
  const topPages = [...byPath.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const maxPath = Math.max(1, ...topPages.map(([, c]) => c));

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>/estatísticas</div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em" }}>Visitas</h2>
        </div>
        <button className="btn btn-ghost mono" style={{ fontSize: 11 }} onClick={() => setTick(tick + 1)} disabled={loading}>
          {loading ? "a atualizar…" : "atualizar"}
        </button>
      </div>

      {!supabaseConfigured && (
        <div style={{ color: "var(--fg-2)", fontSize: 14 }}>Modo local — as estatísticas precisam da base de dados.</div>
      )}
      {supabaseConfigured && error && (
        <div style={{ color: "var(--danger)", fontSize: 13 }}>
          Sem acesso às visitas — confirmar a migração de estatísticas no Supabase.
        </div>
      )}

      {supabaseConfigured && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {([["hoje", today], ["últimos 7 dias", last7], ["desde sempre", total ?? 0]] as const).map(([label, value]) => (
              <div key={label} style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
                <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 30, fontWeight: 300, letterSpacing: "-0.02em" }}>{loading ? "…" : value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
              visitas por dia — últimos 14 dias
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
              {days.map((d) => (
                <div key={d.key} title={`${d.count} visita${d.count === 1 ? "" : "s"} · dia ${d.label}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", cursor: "default" }}>
                  <div style={{ height: `${Math.max(2, (d.count / maxDay) * 100)}%`, minHeight: 2, background: d.count > 0 ? "var(--accent)" : "var(--bg-3)", borderRadius: "3px 3px 0 0", transition: "height 240ms var(--ease-out)" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
              {days.map((d, i) => (
                <div key={d.key} className="mono" style={{ flex: 1, textAlign: "center", fontSize: 9, color: "var(--fg-4)" }}>
                  {i % 2 === 0 ? d.label : ""}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "18px 20px" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
              páginas mais vistas — últimos 30 dias
            </div>
            {topPages.length === 0 && !loading && (
              <div style={{ fontSize: 13, color: "var(--fg-3)" }}>Ainda sem visitas registadas.</div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topPages.map(([path, count]) => (
                <div key={path} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
                  <div>
                    <div className="mono" style={{ fontSize: 12, color: "var(--fg-2)", marginBottom: 4 }}>{path === "/" ? "/ (início)" : path}</div>
                    <div style={{ height: 4, background: "var(--bg-3)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${(count / maxPath) * 100}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }} />
                    </div>
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: "var(--fg)" }}>{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)", lineHeight: 1.5 }}>
            sem cookies nem dados pessoais — cada página vista é uma linha (caminho + data);
            visitas com sessão de admin iniciada não contam
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- CV ----------

function CvView() {
  const { value: cvUrl, loading, refresh } = useSetting("cv_url");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") { setError("O CV tem de ser um PDF."); return; }
    if (file.size > 8 * 1024 * 1024) { setError("Máximo 8 MB."); return; }
    setBusy(true);
    setError(null);
    try {
      const url = await uploadThumb(file, "cv");
      await setSetting("cv_url", url);
      refresh();
    } catch {
      setError("Não foi possível carregar — confirmar a migração do CV no Supabase.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Remover o CV? O botão de descarregar desaparece do site.")) return;
    setBusy(true);
    setError(null);
    try {
      await setSetting("cv_url", null);
      refresh();
    } catch {
      setError("Não foi possível remover — tentar novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>/cv</div>
      <h2 style={{ margin: "0 0 24px", fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em" }}>Currículo</h2>

      <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: loading ? "var(--fg-4)" : cvUrl ? "var(--success)" : "var(--warn)", boxShadow: cvUrl ? "0 0 8px var(--success)" : "none" }} />
          <span style={{ fontSize: 14 }}>
            {loading ? "a verificar…" : cvUrl ? "CV carregado — o botão de descarregar está visível no site." : "Sem CV — o botão de descarregar não aparece no site."}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <label className="btn" style={{ cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 }}>
            <Icon name="upload" size={14} /> {busy ? "a carregar…" : cvUrl ? "substituir CV" : "carregar CV"}
            <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={onPick} disabled={busy} />
          </label>
          {cvUrl && (
            <>
              <a className="btn btn-ghost" href={cvUrl} target="_blank" rel="noopener">
                <Icon name="external" size={13} /> abrir
              </a>
              <button type="button" className="btn btn-ghost mono" style={{ fontSize: 11 }} onClick={remove} disabled={busy}>
                <Icon name="trash" size={12} /> remover
              </button>
            </>
          )}
        </div>
        {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
        <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)", lineHeight: 1.5 }}>
          pdf até 8 MB — fica no Supabase Storage; o site só mostra o botão quando existe um CV
        </div>
      </div>
    </div>
  );
}

// estado da BD medido com uma query real (latência incluída), a cada 30s
function DbStatus({ projects, messages, unread }: { projects: number; messages: number; unread: number }) {
  const [ok, setOk] = useState<boolean | null>(null);
  const [ping, setPing] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const check = async () => {
      const t0 = performance.now();
      const { error } = await supabase!.from("projects").select("id", { head: true, count: "exact" });
      if (!alive) return;
      setOk(!error);
      setPing(error ? null : Math.round(performance.now() - t0));
    };
    check();
    const id = setInterval(check, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <div style={{ marginTop: "auto", padding: 12, background: "var(--bg-2)", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: !supabaseConfigured ? "var(--warn)" : ok === false ? "var(--danger)" : ok ? "var(--success)" : "var(--fg-4)", boxShadow: ok ? "0 0 8px var(--success)" : "none" }} />
        base de dados
      </div>
      {supabaseConfigured ? (
        <div className="mono" style={{ fontSize: 11.5, color: "var(--fg-2)", lineHeight: 2 }}>
          <div>{ok === null ? "a verificar…" : ok ? <>ligada · <span style={{ color: "var(--success)" }}>{ping} ms</span></> : <span style={{ color: "var(--danger)" }}>sem ligação</span>}</div>
          <div>{projects} projeto{projects === 1 ? "" : "s"} · {messages} mensage{messages === 1 ? "m" : "ns"}</div>
          {unread > 0 && <div style={{ color: "var(--accent)" }}>{unread} por ler</div>}
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: "var(--fg-2)", lineHeight: 1.5 }}>
          Modo local — sem base de dados configurada.
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

function ListView({ projects, totalCount, hiddenCount, showHidden, setShowHidden, search, setSearch, onEdit, onNew, onDelete, onToggleVisibility, onMove, canReorder }: {
  projects: Project[]; totalCount: number; hiddenCount: number;
  showHidden: boolean; setShowHidden: (v: boolean) => void;
  search: string; setSearch: (v: string) => void;
  onEdit: (p: Project) => void; onNew: () => void; onDelete: (p: Project) => void;
  onToggleVisibility: (p: Project) => void;
  onMove: (p: Project, dir: -1 | 1) => void; canReorder: boolean;
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
        <div className="mono" style={{ display: "grid", gridTemplateColumns: "32px 2.4fr 1fr 1.4fr 0.9fr 160px", gap: 16, padding: "12px 18px", borderBottom: "1px solid var(--line)", color: "var(--fg-4)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          <span></span>
          <span>título</span>
          <span>ano · função</span>
          <span>stack</span>
          <span>estado</span>
          <span></span>
        </div>
        {projects.map((p, i) => (
          <ProjectRow key={p.id} project={p} onEdit={onEdit} onDelete={onDelete} onToggleVisibility={onToggleVisibility} last={i === projects.length - 1} onMove={onMove} canReorder={canReorder} isFirst={i === 0} isLast={i === projects.length - 1} />
        ))}
        {projects.length === 0 && (
          <div style={{ padding: 60, textAlign: "center", color: "var(--fg-3)" }}>
            <div className="mono" style={{ fontSize: 12, marginBottom: 8 }}>sem resultados</div>
            <div style={{ fontSize: 14 }}>
              tentar outra pesquisa, ou <button onClick={() => setSearch("")} style={{ background: "none", border: 0, color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}>limpar filtro</button>
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

function ProjectRow({ project, onEdit, onDelete, onToggleVisibility, last, onMove, canReorder, isFirst, isLast }: { project: Project; onEdit: (p: Project) => void; onDelete: (p: Project) => void; onToggleVisibility: (p: Project) => void; last: boolean; onMove: (p: Project, dir: -1 | 1) => void; canReorder: boolean; isFirst: boolean; isLast: boolean }) {
  const [hover, setHover] = useState(false);
  const isHidden = project.status === "hidden";
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onEdit(project)}
      style={{ display: "grid", gridTemplateColumns: "32px 2.4fr 1fr 1.4fr 0.9fr 160px", gap: 16, padding: "16px 18px", borderBottom: last ? "none" : "1px solid var(--line)", background: hover ? "var(--bg-2)" : "transparent", cursor: "pointer", alignItems: "center", transition: "background 120ms var(--ease-out)", opacity: isHidden ? 0.62 : 1 }}
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
        {canReorder && (
          <>
            <button className="btn btn-icon" disabled={isFirst} style={{ opacity: isFirst ? 0.3 : 1 }} onClick={(e) => { e.stopPropagation(); onMove(project, -1); }} title="subir na grelha">
              <Icon name="chevronLeft" size={13} style={{ transform: "rotate(90deg)" }} />
            </button>
            <button className="btn btn-icon" disabled={isLast} style={{ opacity: isLast ? 0.3 : 1 }} onClick={(e) => { e.stopPropagation(); onMove(project, 1); }} title="descer na grelha">
              <Icon name="chevronLeft" size={13} style={{ transform: "rotate(-90deg)" }} />
            </button>
          </>
        )}
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
  role: Project["role"];
  tagline: Project["tagline"];
  summary: Project["summary"];
  tags: string[];
  github: string;
  demo: string;
  course: Project["course"];
  status: "published" | "hidden";
  featured: Project["featured"];
  accent: string;
  image: string | null;
  gallery: string[] | null;
  metrics: Project["metrics"];
  team: string[] | null;
  story: Project["story"];
  build: Project["build"];
};

// par editável {pt, en} a partir de um valor Localized
type LocPair = { pt: string; en: string };

function toPair(v?: Project["role"]): LocPair {
  return { pt: pickPt(v), en: v != null && typeof v === "object" ? (v.en ?? "") : "" };
}

// EN vazio ou igual ao PT grava como string única; senão grava bilingue
function toLoc(p: LocPair): Project["role"] {
  const pt = p.pt.trim();
  const en = p.en.trim();
  return en && en !== pt ? { pt, en } : pt;
}

function EditView({ project, onSave, onCancel, isNew }: { project: Project | null; onSave: (d: EditFormData) => void; onCancel: () => void; isNew: boolean }) {
  const [form, setForm] = useState({
    title: project?.title || "",
    slug: project?.slug || "",
    year: project?.year || String(new Date().getFullYear()),
    role: project ? toPair(project.role) : { pt: "Solo", en: "" },
    tagline: toPair(project?.tagline),
    summary: toPair(project?.summary),
    tags: project?.tags?.join(", ") || "",
    github: project?.github || "",
    demo: project?.demo || "",
    course: toPair(project?.course),
    status: (project?.status || (isNew ? "hidden" : "published")) as "published" | "hidden",
    featured: (project?.featured || "small") as Project["featured"],
    accent: project?.accent || "#E5E5E7",
    image: (project?.image ?? null) as string | null,
    gallery: (project?.gallery || []) as string[],
    team: project?.team?.join(", ") || "",
    metrics: (project?.metrics || []).map((m) => ({ label: toPair(m.label), value: toPair(m.value) })),
    story: (project?.story || []).map((s) => ({ kind: toPair(s.kind), title: toPair(s.title), body: toPair(s.body) })),
    build: (project?.build || []).map((b) => ({ title: toPair(b.title), body: toPair(b.body) })),
  });

  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });

  // idioma ativo no editor; os campos de texto alternam entre PT e EN
  const [editLang, setEditLang] = useState<"pt" | "en">("pt");
  const withLang = (p: LocPair, v: string): LocPair => ({ ...p, [editLang]: v });
  const lv = (p: LocPair) => p[editLang];
  const ph = (p: LocPair, fallback: string) => (editLang === "en" && p.pt ? p.pt : fallback);
  const disp = (p: LocPair) => (lv(p).trim() ? lv(p) : p.pt);

  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);
  const [svgOpen, setSvgOpen] = useState(false);
  const [svgCode, setSvgCode] = useState("");

  const slugAtual = () =>
    form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "projeto";

  const enviarFicheiro = async (file: File) => {
    setUploading(true);
    setImgError(null);
    try {
      const url = await uploadThumb(file, slugAtual());
      update("image", url);
      return true;
    } catch {
      setImgError("Não foi possível carregar — confirmar a migração de imagens no Supabase.");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setImgError("Máximo 4 MB."); return; }
    await enviarFicheiro(file);
  };

  const [galUploading, setGalUploading] = useState(false);
  const [galError, setGalError] = useState<string | null>(null);

  const onPickGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    if (files.some((f) => f.size > 4 * 1024 * 1024)) { setGalError("Máximo 4 MB por imagem."); return; }
    setGalUploading(true);
    setGalError(null);
    try {
      const urls: string[] = [];
      for (const file of files) urls.push(await uploadThumb(file, `${slugAtual()}-galeria`));
      update("gallery", [...form.gallery, ...urls]);
    } catch {
      setGalError("Não foi possível carregar — confirmar a migração da galeria no Supabase.");
    } finally {
      setGalUploading(false);
    }
  };

  // código SVG colado -> guardado como ficheiro .svg no Storage e servido
  // como <img> (animações funcionam; scripts nunca correm nesse contexto)
  const usarSvgColado = async () => {
    const code = svgCode.trim();
    if (!code.toLowerCase().startsWith("<svg")) { setImgError("O código tem de começar por <svg."); return; }
    const file = new File([code], `${slugAtual()}.svg`, { type: "image/svg+xml" });
    if (await enviarFicheiro(file)) {
      setSvgCode("");
      setSvgOpen(false);
    }
  };

  // helpers para as listas dinâmicas
  const updRow = <T,>(list: T[], i: number, patch: Partial<T>): T[] =>
    list.map((row, j) => (j === i ? { ...row, ...patch } : row));
  const delRow = <T,>(list: T[], i: number): T[] => list.filter((_, j) => j !== i);
  const moveRow = <T,>(list: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return list;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };

  const submit = () => {
    if (!form.title.trim()) return;
    const slug = form.slug.trim() || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const metrics = form.metrics
      .filter((m) => m.label.pt.trim() && m.value.pt.trim())
      .map((m) => ({ label: toLoc(m.label), value: toLoc(m.value) }));

    const story = form.story
      .filter((s) => s.title.pt.trim() || s.body.pt.trim())
      .map((s) => ({ kind: toLoc(s.kind), title: toLoc(s.title), body: toLoc(s.body) }));

    const build = form.build
      .filter((b) => b.title.pt.trim() || b.body.pt.trim())
      .map((b) => ({ title: toLoc(b.title), body: toLoc(b.body) }));

    const team = form.team.split(",").map((t) => t.trim()).filter(Boolean);

    onSave({
      title: form.title.trim(),
      slug,
      year: form.year,
      status: form.status,
      github: form.github,
      demo: form.demo,
      featured: form.featured,
      accent: form.accent,
      image: form.image,
      gallery: form.gallery.length ? form.gallery : null,
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      role: toLoc(form.role),
      tagline: toLoc(form.tagline),
      summary: toLoc(form.summary),
      course: toLoc(form.course),
      metrics,
      team: team.length ? team : null,
      story: story.length ? story : null,
      build: build.length ? build : null,
    });
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
          <FormSection title="idioma dos textos">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {([["pt", "português", "textos principais do site"], ["en", "english", "tradução — vazio usa o PT"]] as const).map(([v, label, sub]) => {
                const active = editLang === v;
                return (
                  <button key={v} type="button" onClick={() => setEditLang(v)} style={{ background: active ? "var(--bg-2)" : "var(--bg-1)", border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`, borderRadius: "var(--r-md)", padding: "12px 10px", cursor: "pointer", color: active ? "var(--fg)" : "var(--fg-3)", textAlign: "center", transition: "all 140ms var(--ease-out)" }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", marginTop: 4 }}>{sub}</div>
                  </button>
                );
              })}
            </div>
          </FormSection>

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
                <input className="input" value={lv(form.role)} onChange={(e) => update("role", withLang(form.role, e.target.value))} placeholder={ph(form.role, "Solo · Trabalho universitário")} />
              </AField>
            </div>
            <AField label="cadeira / contexto" hint="opcional">
              <input className="input" value={lv(form.course)} onChange={(e) => update("course", withLang(form.course, e.target.value))} placeholder={ph(form.course, "Programação Avançada · ISEC")} />
            </AField>
            <AField label="tagline" hint="uma linha, vista no cartão">
              <input className="input" value={lv(form.tagline)} onChange={(e) => update("tagline", withLang(form.tagline, e.target.value))} placeholder={ph(form.tagline, "Mergulha, recolhe, sobrevive…")} />
            </AField>
            <AField label="resumo" hint="2–3 frases">
              <textarea className="textarea" value={lv(form.summary)} onChange={(e) => update("summary", withLang(form.summary, e.target.value))} rows={4} style={{ fontFamily: "var(--font-display)", fontSize: 13 }} placeholder={ph(form.summary, "")} />
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

          <FormSection title="aparência do cartão">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {([["tall", "alto", "1 col × 2 linhas"], ["wide", "largo", "2 colunas"], ["small", "pequeno", "1 × 1"]] as const).map(([v, label, sub]) => {
                const active = form.featured === v;
                return (
                  <button key={v} type="button" onClick={() => update("featured", v)} style={{ background: active ? "var(--bg-2)" : "var(--bg-1)", border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`, borderRadius: "var(--r-md)", padding: "12px 10px", cursor: "pointer", color: active ? "var(--fg)" : "var(--fg-3)", textAlign: "center", transition: "all 140ms var(--ease-out)" }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                    <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", marginTop: 4 }}>{sub}</div>
                  </button>
                );
              })}
            </div>
            <AField label="cor de destaque" hint="brilho e detalhes do cartão">
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="color" value={form.accent} onChange={(e) => update("accent", e.target.value)} style={{ width: 42, height: 34, padding: 2, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", cursor: "pointer" }} />
                <input className="input mono" value={form.accent} onChange={(e) => update("accent", e.target.value)} style={{ width: 120 }} />
              </div>
            </AField>
          </FormSection>

          <FormSection title="imagem">
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 128, height: 92, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--line)", background: "var(--bg-1)", flexShrink: 0 }}>
                <ProjectThumb id={project?.id || ""} image={form.image} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <label className="btn" style={{ cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.7 : 1 }}>
                    <Icon name="upload" size={14} /> {uploading ? "a carregar…" : "carregar imagem"}
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: "none" }} onChange={onPickImage} disabled={uploading} />
                  </label>
                  <button type="button" className="btn btn-ghost mono" style={{ fontSize: 11 }} onClick={() => setSvgOpen(!svgOpen)}>
                    <Icon name="code" size={12} /> {svgOpen ? "fechar editor SVG" : "colar código SVG"}
                  </button>
                </div>
                {svgOpen && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <textarea
                      className="textarea"
                      value={svgCode}
                      onChange={(e) => setSvgCode(e.target.value)}
                      rows={6}
                      placeholder={'<svg viewBox="0 0 180 160" xmlns="http://www.w3.org/2000/svg">…</svg>'}
                    />
                    <button type="button" className="btn" style={{ alignSelf: "flex-start" }} onClick={usarSvgColado} disabled={uploading || !svgCode.trim()}>
                      <Icon name="check" size={13} /> usar este SVG
                    </button>
                  </div>
                )}
                {form.image && (
                  <button type="button" className="btn btn-ghost mono" style={{ alignSelf: "flex-start", fontSize: 11 }} onClick={() => update("image", null)}>
                    <Icon name="trash" size={12} /> remover (volta à ilustração em código)
                  </button>
                )}
                {imgError && <div style={{ color: "var(--danger)", fontSize: 12 }}>{imgError}</div>}
                <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)", lineHeight: 1.5 }}>
                  png · jpg · webp · svg até 4 MB — fica no Supabase Storage; SVGs mantêm animações
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="galeria — página do projeto">
            {form.gallery.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {form.gallery.map((src, i) => (
                  <div key={src} style={{ position: "relative", width: 132 }}>
                    <div style={{ width: 132, height: 84, borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--line)", background: "var(--bg-1)" }}>
                      <img src={src} alt={`galeria ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      <button type="button" className="btn btn-icon" title="mover para trás" disabled={i === 0} style={{ opacity: i === 0 ? 0.3 : 1 }} onClick={() => update("gallery", moveRow(form.gallery, i, -1))}>
                        <Icon name="chevronLeft" size={12} />
                      </button>
                      <button type="button" className="btn btn-icon" title="remover" onClick={() => update("gallery", delRow(form.gallery, i))}>
                        <Icon name="trash" size={12} />
                      </button>
                      <button type="button" className="btn btn-icon" title="mover para a frente" disabled={i === form.gallery.length - 1} style={{ opacity: i === form.gallery.length - 1 ? 0.3 : 1 }} onClick={() => update("gallery", moveRow(form.gallery, i, 1))}>
                        <Icon name="chevronLeft" size={12} style={{ transform: "rotate(180deg)" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <label className="btn" style={{ cursor: galUploading ? "wait" : "pointer", opacity: galUploading ? 0.7 : 1, alignSelf: "flex-start" }}>
              <Icon name="upload" size={14} /> {galUploading ? "a carregar…" : "carregar imagens"}
              <input type="file" multiple accept="image/png,image/jpeg,image/webp" style={{ display: "none" }} onChange={onPickGallery} disabled={galUploading} />
            </label>
            {galError && <div style={{ color: "var(--danger)", fontSize: 12 }}>{galError}</div>}
            <div className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)", lineHeight: 1.5 }}>
              prints do projeto, mostrados por esta ordem na página; png · jpg · webp até 4 MB cada
            </div>
          </FormSection>

          <FormSection title="métricas do cartão">
            {form.metrics.map((m, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 34px", gap: 10, alignItems: "center" }}>
                <input className="input" value={lv(m.label)} onChange={(e) => update("metrics", updRow(form.metrics, i, { label: withLang(m.label, e.target.value) }))} placeholder={ph(m.label, "rótulo (ex.: nota final)")} />
                <input className="input mono" value={lv(m.value)} onChange={(e) => update("metrics", updRow(form.metrics, i, { value: withLang(m.value, e.target.value) }))} placeholder={ph(m.value, "valor (ex.: 94 / 100)")} />
                <button type="button" className="btn btn-icon" title="remover" onClick={() => update("metrics", delRow(form.metrics, i))}>
                  <Icon name="trash" size={13} />
                </button>
              </div>
            ))}
            {form.metrics.length < 3 && (
              <button type="button" className="btn btn-ghost mono" style={{ fontSize: 11, alignSelf: "flex-start" }} onClick={() => update("metrics", [...form.metrics, { label: { pt: "", en: "" }, value: { pt: "", en: "" } }])}>
                <Icon name="plus" size={12} /> adicionar métrica
              </button>
            )}
          </FormSection>

          <FormSection title="equipa">
            <AField label="membros" hint="nomes separados por vírgulas; vazio = sem secção">
              <input className="input" value={form.team} onChange={(e) => update("team", e.target.value)} placeholder="Diogo Pinto, Rafael Marques" />
            </AField>
          </FormSection>

          <FormSection title="história — página do projeto">
            {form.story.map((s, i) => (
              <div key={i} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 14, display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
                <button type="button" className="btn btn-icon" title="remover passo" onClick={() => update("story", delRow(form.story, i))} style={{ position: "absolute", top: 10, right: 10 }}>
                  <Icon name="trash" size={13} />
                </button>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, paddingRight: 40 }}>
                  <input className="input mono" value={lv(s.kind)} onChange={(e) => update("story", updRow(form.story, i, { kind: withLang(s.kind, e.target.value) }))} placeholder={ph(s.kind, "etiqueta (ex.: o desafio)")} />
                  <input className="input" value={lv(s.title)} onChange={(e) => update("story", updRow(form.story, i, { title: withLang(s.title, e.target.value) }))} placeholder={ph(s.title, "título do passo")} />
                </div>
                <textarea className="textarea" value={lv(s.body)} onChange={(e) => update("story", updRow(form.story, i, { body: withLang(s.body, e.target.value) }))} rows={3} style={{ fontFamily: "var(--font-display)", fontSize: 13 }} placeholder={ph(s.body, "texto do passo")} />
              </div>
            ))}
            <button type="button" className="btn btn-ghost mono" style={{ fontSize: 11, alignSelf: "flex-start" }} onClick={() => update("story", [...form.story, { kind: { pt: "", en: "" }, title: { pt: "", en: "" }, body: { pt: "", en: "" } }])}>
              <Icon name="plus" size={12} /> adicionar passo
            </button>
          </FormSection>

          <FormSection title="como está feito — página do projeto">
            {form.build.map((b, i) => (
              <div key={i} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 14, display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
                <button type="button" className="btn btn-icon" title="remover ponto" onClick={() => update("build", delRow(form.build, i))} style={{ position: "absolute", top: 10, right: 10 }}>
                  <Icon name="trash" size={13} />
                </button>
                <input className="input" value={lv(b.title)} onChange={(e) => update("build", updRow(form.build, i, { title: withLang(b.title, e.target.value) }))} placeholder={ph(b.title, "título (ex.: Máquina de estados)")} style={{ marginRight: 40 }} />
                <textarea className="textarea" value={lv(b.body)} onChange={(e) => update("build", updRow(form.build, i, { body: withLang(b.body, e.target.value) }))} rows={3} style={{ fontFamily: "var(--font-display)", fontSize: 13 }} placeholder={ph(b.body, "descrição")} />
              </div>
            ))}
            <button type="button" className="btn btn-ghost mono" style={{ fontSize: 11, alignSelf: "flex-start" }} onClick={() => update("build", [...form.build, { title: { pt: "", en: "" }, body: { pt: "", en: "" } }])}>
              <Icon name="plus" size={12} /> adicionar ponto
            </button>
          </FormSection>

          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", lineHeight: 1.6 }}>
            nota: o seletor de idioma no topo alterna os textos entre PT e EN;
            campos EN vazios mostram o texto PT no site.
          </div>
        </div>

        {/* pré-visualização do cartão */}
        <aside style={{ position: "sticky", top: 32, alignSelf: "start" }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>pré-visualização do cartão</div>
          {(() => {
            const metricsFilled = form.metrics.filter((m) => m.label.pt.trim() && m.value.pt.trim());
            const teamNames = form.team.split(",").map((t) => t.trim()).filter(Boolean);
            return (
              <div style={{ background: "var(--bg-1)", border: `1px solid ${form.status === "hidden" ? "var(--warn)" : "var(--line)"}`, borderRadius: "var(--r-lg)", overflow: "hidden", opacity: form.status === "hidden" ? 0.7 : 1, boxShadow: `0 0 0 1px ${form.accent}22, 0 0 24px ${form.accent}18` }}>
                <div style={{ height: 110, borderBottom: "1px solid var(--line)", position: "relative", background: "var(--bg-2)" }}>
                  <ProjectThumb id={project?.id || ""} image={form.image} />
                  <span className="mono" style={{ position: "absolute", top: 8, right: 8, fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "var(--glass)", backdropFilter: "blur(6px)", border: "1px solid var(--line)", color: "var(--fg-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {form.featured === "tall" ? "alto" : form.featured === "wide" ? "largo" : "pequeno"}
                  </span>
                  {form.status === "hidden" && (
                    <span className="mono" style={{ position: "absolute", top: 8, left: 8, fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "var(--glass)", border: "1px solid var(--warn)", color: "var(--warn)", textTransform: "uppercase", letterSpacing: "0.08em" }}>oculto</span>
                  )}
                </div>
                <div style={{ padding: 14 }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--fg-3)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 999, background: form.accent, boxShadow: `0 0 6px ${form.accent}` }} />
                    {form.year || "—"} · {disp(form.role) || "—"}
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.02em" }}>{form.title || "Sem título"}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-2)", marginTop: 5, marginBottom: 10 }}>{disp(form.tagline) || "—"}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {form.tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 4).map((t) => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                  {metricsFilled.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${metricsFilled.length}, 1fr)`, gap: 8, marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                      {metricsFilled.map((m, i) => (
                        <div key={i}>
                          <div className="mono" style={{ fontSize: 13, color: "var(--fg)" }}>{disp(m.value)}</div>
                          <div className="mono" style={{ fontSize: 9, color: "var(--fg-4)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>{disp(m.label)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {teamNames.length > 0 && (
                    <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", marginTop: 10 }}>
                      equipa: {teamNames.join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", marginTop: 12, lineHeight: 1.6 }}>
            história: {form.story.filter((s) => s.title.pt.trim() || s.body.pt.trim()).length} passo(s) ·
            arquitetura: {form.build.filter((b) => b.title.pt.trim() || b.body.pt.trim()).length} ponto(s) ·
            galeria: {form.gallery.length} imagem(ns)
          </div>
        </aside>
      </div>
    </div>
  );
}

function VisibilityToggle({ value, onChange }: { value: "published" | "hidden"; onChange: (v: "published" | "hidden") => void }) {
  const opts = [
    { v: "published" as const, label: "Publicado", sub: "Visível na página inicial.", color: "var(--success)" },
    { v: "hidden" as const, label: "Oculto", sub: "Apenas visível no admin.", color: "var(--warn)" },
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
          As mensagens novas chegam por <strong style={{ color: "var(--fg)" }}>email</strong> (via Web3Forms).{" "}
          {supabaseConfigured
            ? <>Este é o <strong style={{ color: "var(--fg)" }}>arquivo central</strong> — todas as mensagens do formulário ficam aqui, acessíveis em qualquer dispositivo.</>
            : <>Esta lista mostra o histórico guardado <strong style={{ color: "var(--fg)" }}>neste browser</strong>.</>}
        </div>
      </div>

      {messages.length === 0 ? (
        <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: "80px 20px", textAlign: "center" }}>
          <Icon name="command" size={24} style={{ color: "var(--fg-4)", marginBottom: 14 }} />
          <div style={{ fontSize: 15, color: "var(--fg-2)", marginBottom: 6 }}>Ainda não há mensagens neste browser.</div>
          <div className="mono" style={{ fontSize: 12, color: "var(--fg-4)" }}>As mensagens do formulário de contacto aparecem aqui.</div>
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
                    <span className="tag" style={{ flexShrink: 0, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>{SUBJECT_LABELS[m.subject] || m.subject}</span>
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
                <div style={{ fontSize: 14 }}>Selecionar uma mensagem para ler.</div>
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
          <span className="tag accent" style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block" }}>{SUBJECT_LABELS[m.subject] || m.subject}</span>
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
              abre o programa de email com a resposta pronta e endereçada
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
