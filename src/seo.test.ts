import { describe, expect, it } from "vitest";
import { montarTitulo, TITULO_SITE } from "./seo";

describe("montarTitulo", () => {
  it("usa o título do site quando a página não tem nome próprio", () => {
    expect(montarTitulo(null, "pt")).toBe(TITULO_SITE.pt);
    expect(montarTitulo(undefined, "en")).toBe(TITULO_SITE.en);
    expect(montarTitulo("", "en")).toBe(TITULO_SITE.en);
    expect(montarTitulo("   ", "pt")).toBe(TITULO_SITE.pt);
  });

  it("acrescenta o nome ao título quando a página o tem", () => {
    expect(montarTitulo("Deep Sea Mining", "pt")).toBe("Deep Sea Mining — Diogo Pinto");
    expect(montarTitulo("Contact", "en")).toBe("Contact — Diogo Pinto");
  });

  it("não deixa espaços à volta do nome", () => {
    expect(montarTitulo("  Contacto  ", "pt")).toBe("Contacto — Diogo Pinto");
  });
});
