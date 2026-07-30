import { renderToStaticMarkup } from "react-dom/server";
import { THUMBS } from "../src/components/thumbs";

export const OG_W = 1200;
export const OG_H = 630;

const FUNDO = "#0A0A0B";

export function moldarSvg(markup: string): string | null {
  const caixa = markup.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!caixa) return null;

  const [, largura, altura] = caixa;
  const escala = Math.min(OG_W / Number(largura), OG_H / Number(altura));
  const w = Number(largura) * escala;
  const h = Number(altura) * escala;

  const fundo = markup.match(/<rect[^>]*fill="(#[0-9A-Fa-f]{3,8})"/)?.[1] ?? FUNDO;

  const interior = markup
    .replace(/ style="[^"]*"/, "")
    .replace(/^<svg /, `<svg x="${(OG_W - w) / 2}" y="${(OG_H - h) / 2}" width="${w}" height="${h}" `)
    .replace(/ preserveAspectRatio="[^"]*"/, "")
    .replace(/^(<svg[^>]*)>/, '$1 preserveAspectRatio="xMidYMid meet">');

  return tela(`<rect width="${OG_W}" height="${OG_H}" fill="${fundo}"/>${interior}`);
}

export function moldarRaster(dataUri: string): string {
  return tela(
    `<image href="${dataUri}" width="${OG_W}" height="${OG_H}" preserveAspectRatio="xMidYMid slice"/>`,
    ` xmlns:xlink="http://www.w3.org/1999/xlink"`
  );
}

function tela(conteudo: string, extra = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg"${extra} width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">${conteudo}</svg>`;
}

export function svgDoProjeto(id: string): string | null {
  const Thumb = THUMBS[id];
  if (!Thumb) return null;
  return moldarSvg(renderToStaticMarkup(<Thumb />));
}
