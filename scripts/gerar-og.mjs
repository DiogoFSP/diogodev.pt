import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { paginaDoProjeto } from "./og.mjs";
import { gerarImagens } from "./gerar-thumbs.mjs";

const RAIZ = path.resolve(import.meta.dirname, "..");
const DIST = path.join(RAIZ, "dist");

async function lerAmbiente() {
  const env = { ...process.env };
  const ficheiro = path.join(RAIZ, ".env.local");
  if (existsSync(ficheiro)) {
    for (const linha of (await readFile(ficheiro, "utf-8")).split("\n")) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

const env = await lerAmbiente();
const url = env.VITE_SUPABASE_URL;
const chave = env.VITE_SUPABASE_ANON_KEY;

if (!url || !chave) {
  console.warn("[og] sem VITE_SUPABASE_URL/ANON_KEY — páginas por projeto não geradas");
  process.exit(0);
}

const resposta = await fetch(
  `${url}/rest/v1/projects?select=id,slug,title,summary,tagline,status&status=eq.published`,
  { headers: { apikey: chave, Authorization: `Bearer ${chave}` } }
);
if (!resposta.ok) {
  console.error(`[og] o Supabase respondeu ${resposta.status} — a abortar o build`);
  process.exit(1);
}

const projetos = await resposta.json();
const base = await readFile(path.join(DIST, "index.html"), "utf-8");

const imagens = await gerarImagens(projetos);

await mkdir(path.join(DIST, "projeto"), { recursive: true });

for (const p of projetos) {
  const html = paginaDoProjeto(base, p, imagens.has(p.slug));
  await mkdir(path.join(DIST, "projeto", p.slug), { recursive: true });
  await writeFile(path.join(DIST, "projeto", p.slug, "index.html"), html, "utf-8");
  await writeFile(path.join(DIST, "projeto", `${p.slug}.html`), html, "utf-8");
}

console.log(`[og] ${projetos.length} páginas geradas · ${imagens.size} imagens a partir das miniaturas`);
