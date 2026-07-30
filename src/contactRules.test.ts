import { describe, expect, it } from "vitest";
import { contactoValido, validarContacto, type DadosContacto } from "./contactRules";

const bom: DadosContacto = {
  name: "Diogo",
  email: "diogo@diogodev.pt",
  subject: "Proposta",
  message: "Boa tarde, gostava de falar consigo sobre um projeto.",
};

describe("validarContacto", () => {
  it("aceita uma mensagem completa", () => {
    expect(validarContacto(bom)).toEqual({});
    expect(contactoValido(bom)).toBe(true);
  });

  it("exige todos os campos", () => {
    expect(validarContacto({ name: "", email: "", subject: "", message: "" })).toEqual({
      name: "obrigatorio",
      email: "obrigatorio",
      subject: "obrigatorio",
      message: "obrigatorio",
    });
  });

  it("não deixa passar espaços como preenchimento", () => {
    const erros = validarContacto({ ...bom, name: "   ", subject: "\t\n" });
    expect(erros.name).toBe("obrigatorio");
    expect(erros.subject).toBe("obrigatorio");
  });

  it.each(["semarroba.pt", "sem@dominio", "duas@@arrobas.pt", "com espaco@dominio.pt", "@dominio.pt"])(
    "rejeita o email %s",
    (email) => {
      expect(validarContacto({ ...bom, email }).email).toBe("email-invalido");
    }
  );

  it.each(["a@b.pt", "diogo.f.s.p@sub.dominio.co.uk", "nome+etiqueta@gmail.com"])(
    "aceita o email %s",
    (email) => {
      expect(validarContacto({ ...bom, email }).email).toBeUndefined();
    }
  );

  it("pede mais texto abaixo de 10 caracteres", () => {
    expect(validarContacto({ ...bom, message: "ola" }).message).toBe("curta");
    expect(validarContacto({ ...bom, message: "1234567890" }).message).toBeUndefined();
  });

  it("conta o comprimento sem os espaços das pontas", () => {
    expect(validarContacto({ ...bom, message: "   ola    " }).message).toBe("curta");
  });
});
