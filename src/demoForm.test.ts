import { describe, expect, it } from "vitest";
import type { DemoConfig } from "./data";
import { fromDemoForm, toDemoForm, toLoc } from "./demoForm";

// Duas demos reais, uma de cada tipo. Abrir o projeto no admin e gravar
// sem tocar em nada não pode alterar nenhuma delas.
const EMBEBIDO: DemoConfig = {
  tipo: "embebido",
  etiqueta: { pt: "JOGAR NO BROWSER", en: "PLAY IN THE BROWSER" },
  titulo: { pt: "Jogar", en: "Play" },
  intro: {
    pt: "O jogo corre aqui mesmo, no browser. Escolha um modo e comece — não precisa de instalar nada.",
    en: "The game runs right here in your browser. Pick a mode and start — nothing to install.",
  },
  url: "https://diogofsp.github.io/LS-4-em-linha-Especial/",
};

const GUIA: DemoConfig = {
  tipo: "guia",
  titulo: { pt: "Como Executar", en: "How to Run" },
  intro: { pt: "Só corre em Linux.", en: "Linux only." },
  passos: [
    {
      cor: "#27C93F",
      titulo: { pt: "PASSO 1: Clonar e compilar", en: "STEP 1: Clone and build" },
      descricao: { pt: "Precisa do gcc e do make.", en: "You need gcc and make." },
      minimoColuna: 300,
      blocos: [
        { label: "Ubuntu / Debian", cmd: "sudo apt update\nsudo apt install -y build-essential git" },
        {
          label: "No cliente · in the client",
          cmd: { pt: "# um serviço às 10s\nagendar 10 Coimbra 5", en: "# a trip at 10s\nagendar 10 Coimbra 5" },
        },
      ],
    },
  ],
  fonte: null,
};

describe("ida e volta pelo editor do admin", () => {
  it.each([
    ["embebido", EMBEBIDO],
    ["guia", GUIA],
  ])("não altera uma demo do tipo %s", (_nome, demo) => {
    expect(fromDemoForm(toDemoForm(demo))).toEqual(demo);
  });

  it("preserva quebras de linha e acentos dentro dos comandos", () => {
    const voltou = fromDemoForm(toDemoForm(GUIA));
    const cmd = voltou?.tipo === "guia" ? voltou.passos[0].blocos[1].cmd : null;
    expect(cmd).toEqual({ pt: "# um serviço às 10s\nagendar 10 Coimbra 5", en: "# a trip at 10s\nagendar 10 Coimbra 5" });
  });
});

describe("toDemoForm", () => {
  it("um projeto sem demo abre o editor vazio", () => {
    const f = toDemoForm(null);
    expect(f.tipo).toBe("nenhuma");
    expect(f.passos).toEqual([]);
    // e continua sem demo se for gravado assim
    expect(fromDemoForm(f)).toBeNull();
  });

  it("enche sempre os dois lados do par, para os campos serem controlados", () => {
    const f = toDemoForm({ ...EMBEBIDO, titulo: "Jogar" });
    expect(f.titulo).toEqual({ pt: "Jogar", en: "" });
  });
});

describe("fromDemoForm", () => {
  const base = toDemoForm(GUIA);

  it("não grava um embebido sem url", () => {
    expect(fromDemoForm({ ...toDemoForm(EMBEBIDO), url: "   " })).toBeNull();
  });

  it("não grava um guia sem nenhum comando", () => {
    const semComandos = { ...base, passos: base.passos.map((p) => ({ ...p, blocos: [] })) };
    expect(fromDemoForm(semComandos)).toBeNull();
  });

  it("deita fora blocos vazios mas mantém o passo", () => {
    const comLixo = {
      ...base,
      passos: base.passos.map((p) => ({ ...p, blocos: [...p.blocos, { label: { pt: "sobra", en: "" }, cmd: { pt: "  ", en: "" } }] })),
    };
    const saiu = fromDemoForm(comLixo);
    expect(saiu?.tipo === "guia" && saiu.passos[0].blocos).toHaveLength(2);
  });

  it("o bloco de código-fonte é opcional", () => {
    expect(fromDemoForm(base)?.tipo === "guia" && fromDemoForm(base)).toMatchObject({ fonte: null });
    const comFonte = { ...base, fonte: { label: { pt: "COMPILAR", en: "BUILD" }, cmd: { pt: "make all", en: "" } } };
    const saiu = fromDemoForm(comFonte);
    expect(saiu?.tipo === "guia" ? saiu.fonte : null).toEqual({ label: { pt: "COMPILAR", en: "BUILD" }, cmd: "make all" });
  });
});

describe("toLoc", () => {
  it("guarda uma string única quando não há tradução", () => {
    expect(toLoc({ pt: "Maven", en: "" })).toBe("Maven");
  });

  it("guarda uma string única quando o EN é igual ao PT", () => {
    // evita encher a base de dados de pares redundantes
    expect(toLoc({ pt: "Maven", en: "Maven" })).toBe("Maven");
  });

  it("guarda o par quando as duas línguas diferem", () => {
    expect(toLoc({ pt: "Jogar", en: "Play" })).toEqual({ pt: "Jogar", en: "Play" });
  });

  it("limpa espaços das pontas", () => {
    expect(toLoc({ pt: "  Jogar  ", en: "  Play  " })).toEqual({ pt: "Jogar", en: "Play" });
  });
});
