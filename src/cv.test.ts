import { describe, expect, it } from "vitest";
import { comNomeDeFicheiro, cvsDisponiveis, escolherCv, NOME_CV } from "./cv";

const PT = "https://exemplo.supabase.co/storage/v1/object/public/thumbs/cv-pt-1.pdf";
const EN = "https://exemplo.supabase.co/storage/v1/object/public/thumbs/cv-en-1.pdf";

describe("comNomeDeFicheiro", () => {
  it("acrescenta o nome com que o ficheiro é descarregado", () => {
    expect(comNomeDeFicheiro(PT, "pt")).toBe(`${PT}?download=${encodeURIComponent(NOME_CV.pt)}`);
    expect(comNomeDeFicheiro(EN, "en")).toBe(`${EN}?download=${encodeURIComponent(NOME_CV.en)}`);
  });

  it("substitui um download já existente em vez de duplicar", () => {
    const uma = comNomeDeFicheiro(PT, "pt");
    expect(comNomeDeFicheiro(uma, "pt")).toBe(uma);
  });

  it("preserva os outros parâmetros do url", () => {
    expect(comNomeDeFicheiro(`${PT}?t=123`, "pt")).toContain("t=123");
  });

  it("devolve o url intacto quando não é analisável", () => {
    expect(comNomeDeFicheiro("nem-sequer-e-url", "pt")).toBe("nem-sequer-e-url");
  });
});

describe("cvsDisponiveis", () => {
  it("não devolve nada quando não há CV nenhum", () => {
    expect(cvsDisponiveis(null, null, "pt")).toEqual([]);
  });

  it("põe a língua da interface à frente", () => {
    expect(cvsDisponiveis(PT, EN, "en").map((c) => c.lang)).toEqual(["en", "pt"]);
    expect(cvsDisponiveis(PT, EN, "pt").map((c) => c.lang)).toEqual(["pt", "en"]);
  });

  it("devolve só o que existe, já com o nome de descarregamento", () => {
    expect(cvsDisponiveis(PT, null, "en")).toEqual([{ lang: "pt", url: comNomeDeFicheiro(PT, "pt") }]);
    expect(cvsDisponiveis(null, EN, "pt")).toEqual([{ lang: "en", url: comNomeDeFicheiro(EN, "en") }]);
  });

  it("dá a cada língua o seu nome de ficheiro", () => {
    const [en, pt] = cvsDisponiveis(PT, EN, "en");
    expect(en.url).toContain(encodeURIComponent(NOME_CV.en));
    expect(pt.url).toContain(encodeURIComponent(NOME_CV.pt));
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
    expect(escolherCv(lista, "en")?.lang).toBe("en");
    expect(escolherCv(lista, " PT ")?.lang).toBe("pt");
  });

  it("devolve null para língua inválida ou inexistente", () => {
    expect(escolherCv(lista, "fr")).toBeNull();
    expect(escolherCv(cvsDisponiveis(PT, null, "pt"), "en")).toBeNull();
  });

  it("devolve null quando não há CVs", () => {
    expect(escolherCv([], "pt")).toBeNull();
  });
});
