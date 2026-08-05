import { describe, expect, it } from "vitest";
import { SOBRE_OMISSAO, fromSobreForm, lerSobre, toSobreForm, type SobreForm } from "./sobre";

describe("lerSobre", () => {
  it("sem nada guardado devolve o texto de omissão", () => {
    expect(lerSobre(null)).toEqual(SOBRE_OMISSAO);
    expect(lerSobre("")).toEqual(SOBRE_OMISSAO);
  });

  it("ignora JSON inválido ou que não seja um objeto", () => {
    expect(lerSobre("{isto não é json")).toEqual(SOBRE_OMISSAO);
    expect(lerSobre("[1,2,3]")).toEqual(SOBRE_OMISSAO);
    expect(lerSobre("null")).toEqual(SOBRE_OMISSAO);
  });

  it("um campo em falta cai no de omissão, os outros são respeitados", () => {
    const c = lerSobre(JSON.stringify({ intro: "Olá." }));
    expect(c.intro).toBe("Olá.");
    expect(c.bio).toEqual(SOBRE_OMISSAO.bio);
    expect(c.formacao).toEqual(SOBRE_OMISSAO.formacao);
  });

  it("uma lista guardada vazia esconde a secção", () => {
    expect(lerSobre(JSON.stringify({ experiencia: [] })).experiencia).toEqual([]);
  });

  it("uma lista com lixo pelo meio guarda só as entradas válidas", () => {
    const c = lerSobre(JSON.stringify({ bio: ["um", "", null, { pt: "  ", en: "" }, { pt: "dois" }] }));
    expect(c.bio).toEqual(["um", "dois"]);
  });

  it("aceita texto bilingue e colapsa o inglês repetido", () => {
    const c = lerSobre(JSON.stringify({ intro: { pt: "igual", en: "igual" } }));
    expect(c.intro).toBe("igual");
  });

  it("competências sem itens e experiência sem empresa são descartadas", () => {
    const c = lerSobre(
      JSON.stringify({
        competencias: [{ rotulo: "web", itens: [] }, { rotulo: "dados", itens: ["SQL", " ", "Supabase"] }],
        experiencia: [{ cargo: "sem empresa" }, { empresa: "LOBA", pontos: ["fiz coisas"] }],
      })
    );
    expect(c.competencias).toEqual([{ rotulo: "dados", itens: ["SQL", "Supabase"] }]);
    expect(c.experiencia).toEqual([{ empresa: "LOBA", cargo: "", meta: "", pontos: ["fiz coisas"] }]);
  });
});

describe("formulário do admin", () => {
  it("ida e volta pelo formulário não altera o conteúdo", () => {
    expect(fromSobreForm(toSobreForm(SOBRE_OMISSAO))).toEqual(SOBRE_OMISSAO);
  });

  it("as competências viajam como linha separada por vírgulas", () => {
    const form = toSobreForm(SOBRE_OMISSAO);
    expect(form.competencias[1].itens).toBe("React, Vite, REST, Bootstrap, jQuery");
  });

  it("linhas deixadas em branco não são guardadas", () => {
    const form: SobreForm = {
      intro: { pt: "Olá", en: "" },
      bio: [{ pt: "", en: "" }, { pt: "texto", en: "" }],
      disponivel: [{ pt: "", en: "" }],
      resumo: [{ rotulo: { pt: "email", en: "" }, valor: { pt: "", en: "" } }],
      competencias: [{ rotulo: { pt: "web", en: "" }, itens: " , ," }],
      experiencia: [{ empresa: "  ", cargo: { pt: "x", en: "" }, meta: { pt: "", en: "" }, pontos: [] }],
      formacao: [{ curso: { pt: "", en: "" }, escola: { pt: "ISEC", en: "" }, meta: { pt: "", en: "" }, nota: "" }],
    };
    const c = fromSobreForm(form);
    expect(c.bio).toEqual(["texto"]);
    expect(c.disponivel).toEqual([]);
    expect(c.resumo).toEqual([]);
    expect(c.competencias).toEqual([]);
    expect(c.experiencia).toEqual([]);
    expect(c.formacao).toEqual([]);
  });

  it("o que sai do formulário volta a ser lido tal e qual", () => {
    const guardado = JSON.stringify(fromSobreForm(toSobreForm(SOBRE_OMISSAO)));
    expect(lerSobre(guardado)).toEqual(SOBRE_OMISSAO);
  });
});
