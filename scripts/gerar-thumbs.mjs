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

export async function gerarImagens(projetos) {
  const { svgDoProjeto, OG_W, OG_H } = await carregarRenderizador();
  const pasta = path.join(DIST, "og");
  await mkdir(pasta, { recursive: true });

  const feitos = new Map();
  for (const p of projetos) {
    const svg = svgDoProjeto(p.id);
    if (!svg) continue;
    const png = new Resvg(svg, { fitTo: { mode: "width", value: OG_W } }).render().asPng();
    await writeFile(path.join(pasta, `${p.slug}.png`), png);
    feitos.set(p.slug, { largura: OG_W, altura: OG_H });
  }

  await rm(TEMP, { recursive: true, force: true });
  return feitos;
}
