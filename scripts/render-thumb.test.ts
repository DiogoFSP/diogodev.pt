import { describe, expect, it } from "vitest";
import { THUMBS } from "../src/components/thumbs";
import { OG_H, OG_W, svgDoProjeto } from "./render-thumb";

const ids = Object.keys(THUMBS);

describe("svgDoProjeto", () => {
  it("cobre todas as miniaturas do site", () => {
    expect(ids.length).toBeGreaterThanOrEqual(5);
    for (const id of ids) expect(svgDoProjeto(id)).toBeTruthy();
  });

  it.each(ids)("%s sai no tamanho de um cartão", (id) => {
    const svg = svgDoProjeto(id)!;
    expect(svg).toContain(`width="${OG_W}" height="${OG_H}"`);
    expect(svg.startsWith("<svg xmlns=")).toBe(true);
  });

  it.each(ids)("%s mantém a arte inteira e enche o resto com a cor do fundo", (id) => {
    const svg = svgDoProjeto(id)!;
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
    expect(svg).toMatch(new RegExp(`<rect width="${OG_W}" height="${OG_H}" fill="#[0-9A-Fa-f]{3,8}"`));
  });

  it.each(ids)("%s fica centrado na tela", (id) => {
    const svg = svgDoProjeto(id)!;
    const [, x, y, w, h] = svg.match(/<svg x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/)!;
    expect(Number(x) * 2 + Number(w)).toBeCloseTo(OG_W, 1);
    expect(Number(y) * 2 + Number(h)).toBeCloseTo(OG_H, 1);
    expect(Number(w)).toBeLessThanOrEqual(OG_W + 0.5);
    expect(Number(h)).toBeLessThanOrEqual(OG_H + 0.5);
  });

  it("devolve null para um projeto sem miniatura", () => {
    expect(svgDoProjeto("nao-existe")).toBeNull();
  });
});
