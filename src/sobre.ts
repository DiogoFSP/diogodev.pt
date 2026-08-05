import type { Localized } from "./data";
import { toLoc, toPair, type LocPair } from "./demoForm";
import { useSetting } from "./projectsStore";

export const CHAVE_SOBRE = "sobre";

export type ParResumo = { rotulo: Localized; valor: Localized };
export type GrupoCompetencias = { rotulo: Localized; itens: string[] };
export type Emprego = { empresa: string; cargo: Localized; meta: Localized; pontos: Localized[] };
export type Curso = { curso: Localized; escola: Localized; meta: Localized; nota: string };

export type ConteudoSobre = {
  intro: Localized;
  bio: Localized[];
  disponivel: Localized[];
  resumo: ParResumo[];
  competencias: GrupoCompetencias[];
  experiencia: Emprego[];
  formacao: Curso[];
};

export const SOBRE_OMISSAO: ConteudoSobre = {
  intro: {
    pt: "Estudante de Engenharia Informática no ISEC, em Coimbra, com dois estágios em desenvolvimento de software concluídos e um curso profissional de informática antes disso.",
    en: "Computer Engineering student at ISEC, Coimbra, with two completed software internships and a vocational IT diploma behind me.",
  },
  bio: [
    {
      pt: "Faço o estágio curricular no 2.º semestre deste ano letivo e estou aberto a propostas — de estágio ou de projeto.",
      en: "I'll be doing my curricular internship in the second semester of this academic year and I'm open to proposals — internship or project.",
    },
    {
      pt: "Trabalho ao longo de toda a stack — React e TypeScript na web, Java e JavaFX no desktop, C na programação de sistemas em Linux — e levo o que construo até ao fim: este portfólio está em produção, com domínio e pipeline de CI/CD próprios.",
      en: "I build across the whole stack — React and TypeScript on the web, Java and JavaFX on the desktop, C for systems work on Linux — and I ship what I build: this portfolio runs in production on my own domain and CI/CD pipeline.",
    },
    {
      pt: "Antes do percurso universitário concluí o curso Técnico de Informática — Sistemas, base que me permitiu chegar à licenciatura com fundamentos práticos já consolidados. O meu foco está no desenvolvimento de software, desde a modelação de dados até à interface final.",
      en: "Before university I completed the IT Technician course — Systems, a foundation that let me arrive at the degree with hands-on fundamentals already in place. My focus is on software development, from data modelling all the way to the final interface.",
    },
    {
      pt: "Mais recentemente tenho dedicado tempo a explorar como ferramentas de inteligência artificial podem otimizar e agilizar o trabalho técnico do dia-a-dia — um campo que considero cada vez mais relevante e onde pretendo continuar a aprofundar conhecimento.",
      en: "Lately I've been exploring how AI tools can optimize and speed up day-to-day technical work — a field I find increasingly relevant and one I plan to keep going deeper into.",
    },
  ],
  disponivel: [
    { pt: "Estágio curricular — 2.º semestre de 2026/27", en: "Curricular internship — 2nd semester of 2026/27" },
    { pt: "Estágios profissionais", en: "Professional internships" },
    { pt: "Colaborações em projetos", en: "Project collaborations" },
  ],
  resumo: [
    { rotulo: { pt: "localização", en: "location" }, valor: "Coimbra, Portugal" },
    { rotulo: { pt: "formação", en: "degree" }, valor: { pt: "Eng.ª Informática — ISEC", en: "Computer Engineering — ISEC" } },
    { rotulo: { pt: "idiomas", en: "spoken" }, valor: { pt: "Português · Inglês", en: "Portuguese · English" } },
    { rotulo: "email", valor: "diogo@diogodev.pt" },
  ],
  competencias: [
    { rotulo: { pt: "linguagens", en: "languages" }, itens: ["TypeScript", "JavaScript", "Java", "C", "C++", "PHP", "SQL", "HTML", "CSS"] },
    { rotulo: "web", itens: ["React", "Vite", "REST", "Bootstrap", "jQuery"] },
    { rotulo: { pt: "dados", en: "data" }, itens: ["PostgreSQL", "MySQL", "Supabase"] },
    { rotulo: { pt: "sistemas", en: "systems" }, itens: ["Linux", "POSIX threads", "IPC", "Git", "GitHub Actions", "CI/CD"] },
    { rotulo: { pt: "métodos", en: "methods" }, itens: ["POO", "MVC", "Design patterns", "JUnit", "Agile"] },
  ],
  experiencia: [
    {
      empresa: "LOBA",
      cargo: { pt: "Suporte e Desenvolvimento Web — Estágio", en: "Support & Web Development — Internship" },
      meta: "2024 · Oliveira de Azeméis",
      pontos: [
        { pt: "Desenvolvi uma aplicação web que automatiza os relatórios de sites dos clientes.", en: "Built a web application that automates client website reports." },
        { pt: "Trabalhei dentro de uma estrutura profissional de entrega.", en: "Worked inside a professional delivery structure." },
      ],
    },
    {
      empresa: "Azemad",
      cargo: { pt: "Programador Web — Estágio", en: "Web Developer — Internship" },
      meta: "2023 · Oliveira de Azeméis",
      pontos: [
        {
          pt: "Desenvolvi o site da empresa em WordPress, das reuniões de levantamento de requisitos até à entrega.",
          en: "Developed a company website in WordPress, from requirements meetings through to delivery.",
        },
      ],
    },
  ],
  formacao: [
    {
      curso: { pt: "Licenciatura em Engenharia Informática", en: "BSc in Computer Engineering" },
      escola: "Instituto Superior de Engenharia de Coimbra (ISEC)",
      meta: { pt: "2024 — 2027 (previsto)", en: "2024 — 2027 (expected)" },
      nota: "",
    },
    {
      curso: { pt: "Técnico de Informática — Sistemas", en: "IT Technician — Systems" },
      escola: "Escola Básica e Secundária Soares Basto, Oliveira de Azeméis",
      meta: "2021 — 2024",
      nota: "18/20",
    },
  ],
};

function texto(v: unknown): Localized | null {
  if (typeof v === "string") return v.trim() ? v.trim() : null;
  if (v && typeof v === "object") {
    const par = v as { pt?: unknown; en?: unknown };
    const pt = typeof par.pt === "string" ? par.pt.trim() : "";
    const en = typeof par.en === "string" ? par.en.trim() : "";
    if (!pt && !en) return null;
    return en && en !== pt ? { pt, en } : pt || en;
  }
  return null;
}

function lista<T>(v: unknown, item: (x: unknown) => T | null, omissao: T[]): T[] {
  if (!Array.isArray(v)) return omissao;
  return v.map(item).filter((x): x is T => x !== null);
}

function cadeia(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function lerSobre(bruto: string | null): ConteudoSobre {
  if (!bruto) return SOBRE_OMISSAO;
  let dados: Record<string, unknown>;
  try {
    const analisado = JSON.parse(bruto);
    if (!analisado || typeof analisado !== "object" || Array.isArray(analisado)) return SOBRE_OMISSAO;
    dados = analisado as Record<string, unknown>;
  } catch {
    return SOBRE_OMISSAO;
  }

  return {
    intro: texto(dados.intro) ?? SOBRE_OMISSAO.intro,
    bio: lista(dados.bio, texto, SOBRE_OMISSAO.bio),
    disponivel: lista(dados.disponivel, texto, SOBRE_OMISSAO.disponivel),
    resumo: lista<ParResumo>(
      dados.resumo,
      (x) => {
        const o = x as { rotulo?: unknown; valor?: unknown };
        const rotulo = texto(o?.rotulo);
        const valor = texto(o?.valor);
        return rotulo && valor ? { rotulo, valor } : null;
      },
      SOBRE_OMISSAO.resumo
    ),
    competencias: lista<GrupoCompetencias>(
      dados.competencias,
      (x) => {
        const o = x as { rotulo?: unknown; itens?: unknown };
        const rotulo = texto(o?.rotulo);
        const itens = Array.isArray(o?.itens) ? o.itens.map(cadeia).filter(Boolean) : [];
        return rotulo && itens.length ? { rotulo, itens } : null;
      },
      SOBRE_OMISSAO.competencias
    ),
    experiencia: lista<Emprego>(
      dados.experiencia,
      (x) => {
        const o = x as { empresa?: unknown; cargo?: unknown; meta?: unknown; pontos?: unknown };
        const empresa = cadeia(o?.empresa);
        if (!empresa) return null;
        return {
          empresa,
          cargo: texto(o?.cargo) ?? "",
          meta: texto(o?.meta) ?? "",
          pontos: Array.isArray(o?.pontos) ? o.pontos.map(texto).filter((p): p is Localized => p !== null) : [],
        };
      },
      SOBRE_OMISSAO.experiencia
    ),
    formacao: lista<Curso>(
      dados.formacao,
      (x) => {
        const o = x as { curso?: unknown; escola?: unknown; meta?: unknown; nota?: unknown };
        const curso = texto(o?.curso);
        if (!curso) return null;
        return { curso, escola: texto(o?.escola) ?? "", meta: texto(o?.meta) ?? "", nota: cadeia(o?.nota) };
      },
      SOBRE_OMISSAO.formacao
    ),
  };
}

export function useSobre() {
  const { value, loading } = useSetting(CHAVE_SOBRE);
  return { conteudo: lerSobre(value), loading };
}

export type SobreForm = {
  intro: LocPair;
  bio: LocPair[];
  disponivel: LocPair[];
  resumo: { rotulo: LocPair; valor: LocPair }[];
  competencias: { rotulo: LocPair; itens: string }[];
  experiencia: { empresa: string; cargo: LocPair; meta: LocPair; pontos: LocPair[] }[];
  formacao: { curso: LocPair; escola: LocPair; meta: LocPair; nota: string }[];
};

export function toSobreForm(c: ConteudoSobre): SobreForm {
  return {
    intro: toPair(c.intro),
    bio: c.bio.map(toPair),
    disponivel: c.disponivel.map(toPair),
    resumo: c.resumo.map((r) => ({ rotulo: toPair(r.rotulo), valor: toPair(r.valor) })),
    competencias: c.competencias.map((g) => ({ rotulo: toPair(g.rotulo), itens: g.itens.join(", ") })),
    experiencia: c.experiencia.map((e) => ({
      empresa: e.empresa,
      cargo: toPair(e.cargo),
      meta: toPair(e.meta),
      pontos: e.pontos.map(toPair),
    })),
    formacao: c.formacao.map((f) => ({ curso: toPair(f.curso), escola: toPair(f.escola), meta: toPair(f.meta), nota: f.nota })),
  };
}

const preenchido = (p: LocPair) => Boolean(p.pt.trim() || p.en.trim());

export function fromSobreForm(f: SobreForm): ConteudoSobre {
  return {
    intro: toLoc(f.intro),
    bio: f.bio.filter(preenchido).map(toLoc),
    disponivel: f.disponivel.filter(preenchido).map(toLoc),
    resumo: f.resumo.filter((r) => preenchido(r.rotulo) && preenchido(r.valor)).map((r) => ({ rotulo: toLoc(r.rotulo), valor: toLoc(r.valor) })),
    competencias: f.competencias
      .map((g) => ({ rotulo: g.rotulo, itens: g.itens.split(",").map((s) => s.trim()).filter(Boolean) }))
      .filter((g) => preenchido(g.rotulo) && g.itens.length)
      .map((g) => ({ rotulo: toLoc(g.rotulo), itens: g.itens })),
    experiencia: f.experiencia
      .filter((e) => e.empresa.trim())
      .map((e) => ({
        empresa: e.empresa.trim(),
        cargo: toLoc(e.cargo),
        meta: toLoc(e.meta),
        pontos: e.pontos.filter(preenchido).map(toLoc),
      })),
    formacao: f.formacao
      .filter((c) => preenchido(c.curso))
      .map((c) => ({ curso: toLoc(c.curso), escola: toLoc(c.escola), meta: toLoc(c.meta), nota: c.nota.trim() })),
  };
}
