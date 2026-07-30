import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { build } from "esbuild";

const RAIZ = path.resolve(import.meta.dirname, "..");
const DIST = path.join(RAIZ, "dist");
const TEMP = path.join(RAIZ, "node_modules", ".og");

async function carregarRenderizador() {
  const saida = path.join(TEMP, "render-thumb.mjs");
  await build({
    entryPoints: [path.join(RAIZ, "scripts", "render-thumb.tsx")],
    outfile: saida,
    bundle: true,
    format: "esm",
    jsx: "automatic",
    packages: "external",
    logLevel: "warning",
  });
  return import(`file://${saida.replace(/\\/g, "/")}`);
}

async function descarregar(url) {
  const r = await fetch(url);
  if (!r.ok) return null;
  const tipo = r.headers.get("content-type") || "";
  const bytes = Buffer.from(await r.arrayBuffer());
  return { tipo, bytes };
}

async function svgDaImagem(url, molde) {
  const ficheiro = await descarregar(url);
  if (!ficheiro) return null;
  if (ficheiro.tipo.includes("svg") || url.endsWith(".svg")) {
    return molde.moldarSvg(ficheiro.bytes.toString("utf-8"));
  }
  const tipo = ficheiro.tipo.startsWith("image/") ? ficheiro.tipo : "image/png";
  return molde.moldarRaster(`data:${tipo};base64,${ficheiro.bytes.toString("base64")}`);
}

async function svgDoCartao(p, molde) {
  if (p.image) {
    const svg = await svgDaImagem(p.image, molde);
    if (svg) return svg;
  }
  const doCodigo = molde.svgDoProjeto(p.id);
  if (doCodigo) return doCodigo;
  if (Array.isArray(p.gallery) && p.gallery[0]) return svgDaImagem(p.gallery[0], molde);
  return null;
}

export async function gerarImagens(projetos) {
  const molde = await carregarRenderizador();
  const pasta = path.join(DIST, "og");
  await mkdir(pasta, { recursive: true });

  const feitos = new Set();
  for (const p of projetos) {
    const svg = await svgDoCartao(p, molde);
    if (!svg) {
      console.warn(`[og] ${p.slug} sem imagem propria — fica com a do site`);
      continue;
    }
    const png = new Resvg(svg, { fitTo: { mode: "width", value: molde.OG_W } }).render().asPng();
    await writeFile(path.join(pasta, `${p.slug}.png`), png);
    feitos.add(p.slug);
  }

  await rm(TEMP, { recursive: true, force: true });
  return feitos;
}
