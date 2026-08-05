import { describe, expect, it } from "vitest";
import { cliqueSimples } from "./cliques";

describe("cliqueSimples", () => {
  it("o clique esquerdo sem teclas é simples", () => {
    expect(cliqueSimples({ button: 0 })).toBe(true);
    expect(cliqueSimples({})).toBe(true);
  });

  it("o botão do meio não é", () => {
    expect(cliqueSimples({ button: 1 })).toBe(false);
  });

  it("nenhuma tecla modificadora passa", () => {
    expect(cliqueSimples({ button: 0, ctrlKey: true })).toBe(false);
    expect(cliqueSimples({ button: 0, metaKey: true })).toBe(false);
    expect(cliqueSimples({ button: 0, shiftKey: true })).toBe(false);
    expect(cliqueSimples({ button: 0, altKey: true })).toBe(false);
  });
});
