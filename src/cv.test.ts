import { describe, expect, it } from "vitest";
import { cvsDisponiveis, escolherCv } from "./cv";

const PT = "https://exemplo.supabase.co/storage/v1/object/public/thumbs/cv-pt-1.pdf";
const EN = "https://exemplo.supabase.co/storage/v1/object/public/thumbs/cv-en-1.pdf";

describe("cvsDisponiveis", () => {
  it("não devolve nada quando não há CV nenhum", () => {
    expect(cvsDisponiveis(null, null, "pt")).toEqual([]);
  });

  it("põe a língua da interface à frente", () => {
    expect(cvsDisponiveis(PT, EN, "en").map((c) => c.lang)).toEqual(["en", "pt"]);
    expect(cvsDisponiveis(PT, EN, "pt").map((c) => c.lang)).toEqual(["pt", "en"]);
  });

  it("devolve só o que existe", () => {
    expect(cvsDisponiveis(PT, null, "en")).toEqual([{ lang: "pt", url: PT }]);
    expect(cvsDisponiveis(null, EN, "pt")).toEqual([{ lang: "en", url: EN }]);
  });

  it("descarta URLs que não passam no sanitizador", () => {
    expect(cvsDisponiveis("javascript:alert(1)", EN, "pt").map((c) => c.lang)).toEqual(["en"]);
    expect(cvsDisponiveis("nem-sequer-e-url", null, "pt")).toEqual([]);
  });
});

describe("escolherCv", () => {
  const lista = cvsDisponiveis(PT, EN, "pt");

  it("sem argumento devolve o primeiro (língua da interface)", () => {
    expect(escolherCv(lista)?.lang).toBe("pt");
    expect(escolherCv(cvsDisponiveis(PT, EN, "en"))?.lang).toBe("en");
  });

  it("com argumento devolve a língua pedida", () => {
    expect(escolherCv(lista, "en")?.url).toBe(EN);
    expect(escolherCv(lista, " PT ")?.url).toBe(PT);
  });

  it("devolve null para língua inválida ou inexistente", () => {
    expect(escolherCv(lista, "fr")).toBeNull();
    expect(escolherCv(cvsDisponiveis(PT, null, "pt"), "en")).toBeNull();
  });

  it("devolve null quando não há CVs", () => {
    expect(escolherCv([], "pt")).toBeNull();
  });
});
