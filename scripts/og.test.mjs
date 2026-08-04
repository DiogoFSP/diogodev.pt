import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { IMAGEM_OMISSAO, cortar, escapar, loc, paginaDaDemo, paginaDoProjeto, paginaSimples, sitemap } from "./og.mjs";

const INDEX = await readFile(path.resolve(import.meta.dirname, "..", "index.html"), "utf-8");

const PROJETO = {
  slug: "deepsea",
  title: "Deep Sea Mining",
  summary: { pt: "Jogo de estratégia.", en: "Strategy game." },
  tagline: { pt: "Mergulha e sobrevive.", en: "Dive and survive." },
};

const meta = (html, chave) =>
  html.match(new RegExp(`<meta (?:property|name)="${chave}" content="([^"]*)"`))?.[1];

describe("paginaDoProjeto", () => {
  const html = paginaDoProjeto(INDEX, PROJETO, true);

  it("escreve o título e o url do projeto", () => {
    expect(html).toContain("<title>Deep Sea Mining — Diogo Pinto</title>");
    expect(meta(html, "og:title")).toBe("Deep Sea Mining — Diogo Pinto");
    expect(meta(html, "og:url")).toBe("https://diogodev.pt/projeto/deepsea");
    expect(html).toContain('<link rel="canonical" href="https://diogodev.pt/projeto/deepsea"');
  });

  it("aponta para a imagem gerada da miniatura", () => {
    expect(meta(html, "og:image")).toBe("https://diogodev.pt/og/deepsea.png");
    expect(meta(html, "twitter:image")).toBe("https://diogodev.pt/og/deepsea.png");
    expect(meta(html, "og:image:width")).toBe("1200");
    expect(meta(html, "og:image:height")).toBe("630");
  });

  it("cai na imagem do site quando o projeto não tem miniatura", () => {
    const semMiniatura = paginaDoProjeto(INDEX, PROJETO, false);
    expect(meta(semMiniatura, "og:image")).toBe(IMAGEM_OMISSAO);
  });

  it("marca a página como article e não como website", () => {
    expect(meta(html, "og:type")).toBe("article");
    expect(meta(INDEX, "og:type")).toBe("website");
  });

  it("rebenta se o index.html deixar de ter uma das tags", () => {
    const semOgTitle = INDEX.replace(/<meta property="og:title"[^>]*>/, "");
    expect(() => paginaDoProjeto(semOgTitle, PROJETO, true)).toThrow(/tag não encontrada/);
  });

  it("não deixa aspas do conteúdo partir o atributo", () => {
    const comAspas = paginaDoProjeto(INDEX, { ...PROJETO, title: 'Jogo "Especial" & Cia' }, true);
    expect(meta(comAspas, "og:title")).toBe("Jogo &quot;Especial&quot; &amp; Cia — Diogo Pinto");
  });
});

describe("paginaSimples", () => {
  const html = paginaSimples(INDEX, {
    titulo: "Contact — Diogo Pinto",
    descricao: "Fala comigo.",
    url: "https://diogodev.pt/contacto",
  });

  it("aponta o canonical para a própria página e não para a raiz", () => {
    expect(html).toContain('<link rel="canonical" href="https://diogodev.pt/contacto"');
    expect(meta(html, "og:url")).toBe("https://diogodev.pt/contacto");
  });

  it("mantém og:type website, ao contrário das páginas de projeto", () => {
    expect(meta(html, "og:type")).toBe("website");
  });

  it("usa a imagem do site quando não lhe dão outra", () => {
    expect(meta(html, "og:image")).toBe(IMAGEM_OMISSAO);
  });
});

describe("paginaDaDemo", () => {
  const comDemo = { ...PROJETO, demo_config: { titulo: { pt: "Como Jogar", en: "How to Play" } } };
  const html = paginaDaDemo(INDEX, comDemo, true);

  it("junta o nome da demo ao título e aponta para /demo", () => {
    expect(html).toContain("<title>Deep Sea Mining — How to Play</title>");
    expect(meta(html, "og:url")).toBe("https://diogodev.pt/projeto/deepsea/demo");
    expect(html).toContain('<link rel="canonical" href="https://diogodev.pt/projeto/deepsea/demo"');
  });

  it("aguenta um projeto sem titulo na demo", () => {
    const semTitulo = paginaDaDemo(INDEX, { ...PROJETO, demo_config: {} }, false);
    expect(semTitulo).toContain("<title>Deep Sea Mining — Demo</title>");
  });
});

describe("sitemap", () => {
  it("escreve um urlset com uma entrada por endereço", () => {
    const xml = sitemap(["https://diogodev.pt/", "https://diogodev.pt/contacto"]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<loc>https://diogodev.pt/</loc>");
    expect(xml).toContain("<loc>https://diogodev.pt/contacto</loc>");
    expect(xml.match(/<url>/g)).toHaveLength(2);
  });

  it("escapa caracteres que partem XML", () => {
    expect(sitemap(["https://diogodev.pt/?a=1&b=2"])).toContain("a=1&amp;b=2");
  });
});

describe("cortar", () => {
  it("deixa passar texto curto", () => {
    expect(cortar("Jogo de estratégia.")).toBe("Jogo de estratégia.");
  });

  it("corta na palavra e não a meio", () => {
    const cortado = cortar("palavra ".repeat(50), 40);
    expect(cortado.length).toBeLessThanOrEqual(41);
    expect(cortado.endsWith("…")).toBe(true);
    expect(cortado).not.toContain("palav…");
  });

  it("junta linhas e espaços repetidos", () => {
    expect(cortar("uma\n\nfrase   partida")).toBe("uma frase partida");
  });
});

describe("loc", () => {
  it("prefere o inglês e cai no português", () => {
    expect(loc({ pt: "Jogar", en: "Play" })).toBe("Play");
    expect(loc({ pt: "Jogar", en: "" })).toBe("Jogar");
    expect(loc("Maven")).toBe("Maven");
    expect(loc(null)).toBe("");
  });
});

describe("escapar", () => {
  it("trata os caracteres que partem HTML", () => {
    expect(escapar('<script>"x" & y')).toBe("&lt;script&gt;&quot;x&quot; &amp; y");
  });
});
