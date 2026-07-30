import { describe, expect, it } from "vitest";
import { loc } from "./data";

describe("loc", () => {
  it("devolve a string única em qualquer língua", () => {
    expect(loc("Maven", "pt")).toBe("Maven");
    expect(loc("Maven", "en")).toBe("Maven");
  });

  it("escolhe o lado certo do par", () => {
    const v = { pt: "Jogar", en: "Play" };
    expect(loc(v, "pt")).toBe("Jogar");
    expect(loc(v, "en")).toBe("Play");
  });

  it("cai no PT quando falta o EN", () => {
    // é o caso normal: no admin, deixar o EN vazio significa "usa o PT"
    expect(loc({ pt: "Jogar" } as never, "en")).toBe("Jogar");
  });

  it("cai no EN quando falta o PT", () => {
    expect(loc({ en: "Play" } as never, "pt")).toBe("Play");
  });

  it("respeita um EN vazio sem o trocar pelo PT", () => {
    // string vazia é uma escolha, não uma ausência
    expect(loc({ pt: "Jogar", en: "" }, "en")).toBe("");
  });
});
