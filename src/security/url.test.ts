import { describe, expect, it } from "vitest";
import { isSafeInternalPath, sanitizeExternalUrl } from "./url";

describe("isSafeInternalPath", () => {
  it("aceita rotas do site", () => {
    expect(isSafeInternalPath("/projeto/deepsea")).toBe(true);
    expect(isSafeInternalPath("/")).toBe(true);
  });

  it("recusa //dominio, que o browser trata como link externo", () => {
    expect(isSafeInternalPath("//exemplo-mau.pt")).toBe(false);
    expect(isSafeInternalPath("//exemplo-mau.pt/x")).toBe(false);
  });

  it("recusa o que não começa por barra", () => {
    expect(isSafeInternalPath("https://exemplo.pt")).toBe(false);
    expect(isSafeInternalPath("javascript:alert(1)")).toBe(false);
  });

  it("recusa caracteres de controlo escondidos no meio", () => {
    expect(isSafeInternalPath("/proj\neto")).toBe(false);
    expect(isSafeInternalPath("/proj\u0000eto")).toBe(false);
  });
});

describe("sanitizeExternalUrl", () => {
  it("deixa passar http e https", () => {
    expect(sanitizeExternalUrl("https://github.com/DiogoFSP")).toBe("https://github.com/DiogoFSP");
    expect(sanitizeExternalUrl("http://exemplo.pt/")).toBe("http://exemplo.pt/");
  });

  it("bloqueia javascript:", () => {
    expect(sanitizeExternalUrl("javascript:alert(document.cookie)")).toBeNull();
    expect(sanitizeExternalUrl("JavaScript:alert(1)")).toBeNull();
  });

  it("bloqueia data: e outros esquemas", () => {
    expect(sanitizeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(sanitizeExternalUrl("vbscript:msgbox(1)")).toBeNull();
    expect(sanitizeExternalUrl("file:///C:/Windows/System32")).toBeNull();
  });

  it("só aceita mailto e tel quando lhe é dito", () => {
    expect(sanitizeExternalUrl("mailto:diogo@diogodev.pt")).toBeNull();
    expect(sanitizeExternalUrl("mailto:diogo@diogodev.pt", { allowMailto: true })).toBe("mailto:diogo@diogodev.pt");
    expect(sanitizeExternalUrl("tel:+351910000000")).toBeNull();
    expect(sanitizeExternalUrl("tel:+351910000000", { allowTel: true })).toBe("tel:+351910000000");
  });

  it("recusa lixo e vazios", () => {
    expect(sanitizeExternalUrl("")).toBeNull();
    expect(sanitizeExternalUrl("   ")).toBeNull();
    expect(sanitizeExternalUrl("isto não é um url")).toBeNull();
  });

  it("recusa um javascript: disfarçado com espaços ou quebras de linha", () => {
    expect(sanitizeExternalUrl("  javascript:alert(1)  ")).toBeNull();
    expect(sanitizeExternalUrl("java\nscript:alert(1)")).toBeNull();
  });

  it("mantém o url dos ficheiros do Supabase intacto", () => {
    const url = "https://uzphxlsglxlxmmtqwtew.supabase.co/storage/v1/object/public/thumbs/cv-123.pdf";
    expect(sanitizeExternalUrl(url)).toBe(url);
  });
});
