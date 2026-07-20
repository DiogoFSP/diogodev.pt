import { useCallback, useEffect, useState } from "react";
import { PROJECTS, type Project } from "./data";
import { supabase } from "./supabase";

// Camada de dados: Supabase quando configurado no .env.local,
// senão localStorage.

const PROJECTS_KEY = "diogo-projects";
const MESSAGES_KEY = "diogo-messages";

export type Message = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  read: boolean;
};

// ---------------- projetos ----------------

function loadLocalProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (raw) return JSON.parse(raw) as Project[];
  } catch { /* sem storage */ }
  return PROJECTS;
}

function saveLocalProjects(list: Project[]) {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(list)); } catch { /* sem storage */ }
}

export async function fetchProjects(): Promise<Project[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Project[];
  }
  return loadLocalProjects();
}

export async function upsertProject(p: Project): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("projects").upsert(p);
    if (error) throw error;
    return;
  }
  const list = loadLocalProjects();
  const i = list.findIndex((x) => x.id === p.id);
  if (i >= 0) list[i] = p;
  else list.unshift(p);
  saveLocalProjects(list);
}

// upload de imagem para o bucket "thumbs"; devolve o URL público
export async function uploadThumb(file: File, slug: string): Promise<string> {
  if (!supabase) throw new Error("upload requer Supabase configurado");
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${slug}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("thumbs").upload(path, file, { upsert: true });
  if (error) throw error;
  return supabase.storage.from("thumbs").getPublicUrl(path).data.publicUrl;
}

// grava a ordem atual dos projetos (position = índice na lista)
export async function saveProjectOrder(list: Project[]): Promise<void> {
  const ordered = list.map((p, i) => ({ ...p, position: i }));
  if (supabase) {
    const { error } = await supabase.from("projects").upsert(ordered);
    if (error) throw error;
    return;
  }
  saveLocalProjects(ordered);
}

export async function deleteProject(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  saveLocalProjects(loadLocalProjects().filter((x) => x.id !== id));
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchProjects()
      .then(setProjects)
      // em erro de rede/BD, usa os dados originais
      .catch(() => setProjects(PROJECTS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { projects, loading, refresh };
}

// ---------------- estatísticas de visitas ----------------

export type PageView = { path: string; created_at: string };

let lastViewPath = "";
let lastViewAt = 0;

// regista uma visita; falha em silêncio (estatística não é crítica)
export async function recordPageView(path: string): Promise<void> {
  if (!supabase) return;
  // ignora repetições da mesma página em menos de 30s (refresh, StrictMode)
  if (path === lastViewPath && Date.now() - lastViewAt < 30000) return;
  lastViewPath = path;
  lastViewAt = Date.now();
  const { data } = await supabase.auth.getSession();
  if (data.session) return; // visitas com sessão de admin iniciada não contam
  await supabase.from("page_views").insert({ path });
}

export async function fetchPageViews(days: number): Promise<PageView[]> {
  if (!supabase) return [];
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data, error } = await supabase
    .from("page_views")
    .select("path, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(10000);
  if (error) throw error;
  return (data ?? []) as PageView[];
}

export async function fetchTotalViews(): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase.from("page_views").select("id", { head: true, count: "exact" });
  if (error) throw error;
  return count ?? 0;
}

// ---------------- definições do site (chave/valor) ----------------

const SETTINGS_KEY = "diogo-settings";

function loadLocalSettings(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export async function fetchSetting(key: string): Promise<string | null> {
  if (supabase) {
    const { data, error } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
    if (error) throw error;
    return data?.value ?? null;
  }
  return loadLocalSettings()[key] ?? null;
}

export async function setSetting(key: string, value: string | null): Promise<void> {
  if (supabase) {
    if (value === null) {
      const { error } = await supabase.from("settings").delete().eq("key", key);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("settings").upsert({ key, value });
      if (error) throw error;
    }
    return;
  }
  const s = loadLocalSettings();
  if (value === null) delete s[key];
  else s[key] = value;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* sem storage */ }
}

export function useSetting(key: string) {
  const [value, setValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetchSetting(key)
      .then(setValue)
      .catch(() => setValue(null))
      .finally(() => setLoading(false));
  }, [key]);

  useEffect(() => { refresh(); }, [refresh]);

  return { value, loading, refresh };
}

// ---------------- mensagens ----------------

function loadLocalMessages(): Message[] {
  try {
    return JSON.parse(localStorage.getItem(MESSAGES_KEY) || "[]") as Message[];
  } catch {
    return [];
  }
}

function saveLocalMessages(list: Message[]) {
  try { localStorage.setItem(MESSAGES_KEY, JSON.stringify(list.slice(0, 200))); } catch { /* sem storage */ }
}

export async function fetchMessages(): Promise<Message[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    type Row = { id: number; name: string; email: string; subject: string; message: string; read: boolean; created_at: string };
    return ((data ?? []) as Row[]).map((r) => ({
      id: r.id, name: r.name, email: r.email, subject: r.subject,
      message: r.message, read: r.read, date: r.created_at,
    }));
  }
  return loadLocalMessages();
}

export async function addMessage(m: { name: string; email: string; subject: string; message: string }): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("messages").insert(m);
    if (error) throw error;
    return;
  }
  const inbox = loadLocalMessages();
  inbox.unshift({ ...m, id: Date.now(), date: new Date().toISOString(), read: false });
  saveLocalMessages(inbox);
}

// pede o email de confirmação ao visitante; nunca falha para quem chama
// (a confirmação é um extra — o formulário não pode partir por causa dela)
export function sendConfirmation(payload: { name: string; email: string; subject: string; message: string }): void {
  if (!supabase) return;
  supabase.functions.invoke("confirmar-mensagem", { body: payload }).catch(() => {});
}
