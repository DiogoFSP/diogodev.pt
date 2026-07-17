import type { Lang } from "./lang";

// Um texto pode ser igual nas duas línguas (string) ou bilingue ({pt, en})
export type Localized = string | { pt: string; en: string };

export type Metric = { label: Localized; value: Localized };

export type Project = {
  id: string;
  title: string;
  slug: string;
  year: string;
  role: Localized;
  summary: Localized;
  tagline: Localized;
  tags: string[];
  metrics: Metric[];
  accent: string;
  featured: "tall" | "wide" | "small";
  status: "published" | "hidden";
  github: string | null;
  demo: string | null;
  course: Localized;
};

// Tradutor para valores Localized (o t() do contexto só trata strings soltas)
export function loc(v: Localized, lang: Lang): string {
  if (typeof v === "string") return v;
  return v[lang] ?? v.pt ?? v.en;
}

export const PROJECTS: Project[] = [
  {
    id: "deepsea",
    title: "Deep Sea Mining",
    slug: "deepsea",
    year: "2026",
    role: { pt: "Trabalho universitário · Grupo de 3", en: "University project · Team of 3" },
    summary: {
      pt: "Jogo de estratégia e exploração em alto-mar. O jogador comanda um navio e três drones submarinos para recuperar artefactos de uma civilização antiga, gerindo combustível e integridade do casco. Arquitetura MVC com máquina de estados, sete padrões de design e testes unitários em JUnit 5.",
      en: "Strategy and exploration game set on the open sea. The player commands a ship and three underwater drones to recover artifacts from an ancient civilization, managing fuel and hull integrity. MVC architecture with a state machine, seven design patterns and JUnit 5 unit tests.",
    },
    tagline: {
      pt: "Mergulha, recolhe, sobrevive — e não percas todos os drones.",
      en: "Dive, collect, survive — and don't lose all the drones.",
    },
    tags: ["Java", "JavaFX", "MVC", "FSM", "JUnit 5", "Maven"],
    metrics: [
      { label: { pt: "fases por expedição", en: "phases per expedition" }, value: "4" },
      { label: { pt: "nota final", en: "final grade" }, value: "94 / 100" },
    ],
    accent: "#5EBFFF",
    featured: "tall",
    status: "published",
    github: "https://github.com/Rafael-Marques-960/PA-Project",
    demo: null,
    course: "Programação Avançada · ISEC",
  },
  {
    id: "4inline",
    title: "4 in Line · Special",
    slug: "4-in-line",
    year: "2025",
    role: { pt: "Trabalho universitário · Grupo de 2", en: "University project · Team of 2" },
    summary: {
      pt: "Versão estendida do Connect-Four desenvolvida em React na cadeira de Linguagens e Sistemas. Inclui modos especiais e modo single-player contra o computador, jogável no browser.",
      en: "Extended version of Connect-Four built with React for the Languages and Systems course. Includes special modes and a single-player mode against the computer, playable in the browser.",
    },
    tagline: {
      pt: "Connect-Four, mas com regras a sério.",
      en: "Connect-Four, with real rules this time.",
    },
    tags: ["React", "JavaScript", "CSS"],
    metrics: [
      { label: { pt: "modos de jogo", en: "game modes" }, value: "3" },
      { label: { pt: "nota final", en: "final grade" }, value: "92 / 100" },
    ],
    accent: "#FFB454",
    featured: "tall",
    status: "published",
    github: "https://github.com/DiogoFSP/LS-4-em-linha-Especial",
    demo: null,
    course: "Linguagens e Sistemas · ISEC",
  },
];
