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

export async function setMessageRead(id: number, read: boolean): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("messages").update({ read }).eq("id", id);
    if (error) throw error;
    return;
  }
  saveLocalMessages(loadLocalMessages().map((m) => (m.id === id ? { ...m, read } : m)));
}

export async function markAllMessagesRead(): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("messages").update({ read: true }).eq("read", false);
    if (error) throw error;
    return;
  }
  saveLocalMessages(loadLocalMessages().map((m) => ({ ...m, read: true })));
}

export async function deleteMessage(id: number): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  saveLocalMessages(loadLocalMessages().filter((m) => m.id !== id));
}
