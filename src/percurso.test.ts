import { describe, expect, it } from "vitest";
import type { Project } from "./data";
import { anoInicial, lerMarcos, montarPercurso, type Marco } from "./percurso";

const projeto = (over: Partial<Project>): Project =>
  ({
    id: "x",
    title: "Projeto",
    slug: "x",
    year: "2025",
    role: "",
    summary: "",
    tagline: "",
    tags: [],
    metrics: [],
    accent: "#fff",
    featured: "small",
    status: "published",
    github: null,
    demo: null,
    course: { pt: "Cadeira", en: "Course" },
    ...over,
  }) as Project;

const marco = (ano: string, titulo: string): Marco => ({ ano, titulo, detalhe: "" });

describe("lerMarcos", () => {
  it("aceita a lista guardada nas definições", () => {
    const bruto = JSON.stringify([{ ano: "2024", titulo: { pt: "ISEC", en: "ISEC" }, detalhe: "" }]);
    expect(lerMarcos(bruto)).toHaveLength(1);
  });

  it("não parte com definições vazias ou corrompidas", () => {
    expect(lerMarcos(null)).toEqual([]);
    expect(lerMarcos("isto não é json")).toEqual([]);
    expect(lerMarcos('{"nao":"array"}')).toEqual([]);
  });

  it("ignora entradas sem ano", () => {
    expect(lerMarcos('[{"titulo":"sem ano"},{"ano":"  "},{"ano":"2024","titulo":"boa"}]')).toHaveLength(1);
  });

  it("aceita o ano traduzido nas duas línguas", () => {
    const marcos = lerMarcos('[{"ano":{"pt":"Julho 2024","en":"July 2024"},"titulo":"x","detalhe":""}]');
    expect(marcos).toHaveLength(1);
    expect(montarPercurso([], marcos, "en")[0].ano).toBe("July 2024");
    expect(montarPercurso([], marcos, "pt")[0].ano).toBe("Julho 2024");
  });

  it("ordena pelo ano mesmo quando o rótulo tem o mês à frente", () => {
    const marcos = lerMarcos('[{"ano":"Julho 2024","titulo":"fim","detalhe":""},{"ano":"Setembro 2024","titulo":"inicio","detalhe":""}]');
    expect(montarPercurso([], marcos, "pt").map((i) => i.titulo)).toEqual(["fim", "inicio"]);
  });
});

describe("anoInicial", () => {
  it("lê um intervalo pelo ano em que começa", () => {
    expect(anoInicial("2023–2024")).toBe(2023);
    expect(anoInicial("2025")).toBe(2025);
    expect(anoInicial("sem ano")).toBe(0);
  });

  it("mantém os anos a descer na ordem em que se lêem", () => {
    const anos = ["2024", "2023–2024", "2026"];
    expect([...anos].sort((a, b) => anoInicial(b) - anoInicial(a))).toEqual(["2026", "2024", "2023–2024"]);
  });
});

describe("montarPercurso", () => {
  const projetos = [
    projeto({ id: "a", title: "Recente", year: "2026" }),
    projeto({ id: "b", title: "Antigo", year: "2024" }),
    projeto({ id: "c", title: "Oculto", year: "2026", status: "hidden" }),
  ];

  it("ordena do mais recente para o mais antigo", () => {
    const itens = montarPercurso(projetos, [marco("2025", "ISEC")], "pt");
    expect(itens.map((i) => i.titulo)).toEqual(["Recente", "ISEC", "Antigo"]);
  });

  it("deixa de fora projetos ocultos", () => {
    const itens = montarPercurso(projetos, [], "pt");
    expect(itens.some((i) => i.titulo === "Oculto")).toBe(false);
  });

  it("no mesmo ano, o marco vem antes do projeto", () => {
    const itens = montarPercurso([projeto({ title: "Trabalho", year: "2024" })], [marco("2024", "Entrada")], "pt");
    expect(itens.map((i) => i.tipo)).toEqual(["marco", "projeto"]);
  });

  it("traduz a cadeira do projeto", () => {
    expect(montarPercurso([projeto({})], [], "en")[0].detalhe).toBe("Course");
    expect(montarPercurso([projeto({})], [], "pt")[0].detalhe).toBe("Cadeira");
  });

  it("só os projetos levam ligação", () => {
    const itens = montarPercurso([projeto({ slug: "deepsea" })], [marco("2020", "x")], "pt");
    expect(itens.find((i) => i.tipo === "projeto")?.slug).toBe("deepsea");
    expect(itens.find((i) => i.tipo === "marco")?.slug).toBeUndefined();
  });

  it("funciona sem marcos nenhuns", () => {
    expect(montarPercurso(projetos, [], "pt")).toHaveLength(2);
  });
});
