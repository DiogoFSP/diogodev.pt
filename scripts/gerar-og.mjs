import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { SITE, paginaDaDemo, paginaDoProjeto, paginaSimples, sitemap } from "./og.mjs";
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
  `${url}/rest/v1/projects?select=id,slug,title,summary,tagline,image,gallery,status,demo_config&status=eq.published`,
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

const enderecos = [`${SITE}/`, `${SITE}/sobre`, `${SITE}/contacto`];

async function escrever(destino, html) {
  await mkdir(path.join(DIST, path.dirname(destino)), { recursive: true });
  await writeFile(path.join(DIST, `${destino}.html`), html, "utf-8");
  await mkdir(path.join(DIST, destino), { recursive: true });
  await writeFile(path.join(DIST, destino, "index.html"), html, "utf-8");
}

let demos = 0;
for (const p of projetos) {
  await escrever(path.join("projeto", p.slug), paginaDoProjeto(base, p, imagens.has(p.slug)));
  enderecos.push(`${SITE}/projeto/${p.slug}`);
  if (p.demo_config) {
    await escrever(path.join("projeto", p.slug, "demo"), paginaDaDemo(base, p, imagens.has(p.slug)));
    enderecos.push(`${SITE}/projeto/${p.slug}/demo`);
    demos++;
  }
}

await escrever("sobre", paginaSimples(base, {
  titulo: "About — Diogo Pinto",
  descricao:
    "Computer Engineering student at ISEC, Coimbra, with two completed software internships. Skills, experience and education of Diogo Pinto.",
  url: `${SITE}/sobre`,
}));

await escrever("contacto", paginaSimples(base, {
  titulo: "Contact — Diogo Pinto",
  descricao: "Get in touch with Diogo Pinto about internships, projects and collaborations.",
  url: `${SITE}/contacto`,
}));

await writeFile(path.join(DIST, "sitemap.xml"), sitemap(enderecos), "utf-8");

console.log(`[og] ${projetos.length} projetos · ${demos} demos · sobre · contacto · sitemap com ${enderecos.length} urls · ${imagens.size} imagens`);
