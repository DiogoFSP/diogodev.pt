export type CampoContacto = "name" | "email" | "subject" | "message";
export type ErroContacto = "obrigatorio" | "email-invalido" | "curta";

export const MENSAGEM_MINIMA = 10;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type DadosContacto = Record<CampoContacto, string>;

export function validarContacto(f: DadosContacto): Partial<Record<CampoContacto, ErroContacto>> {
  const erros: Partial<Record<CampoContacto, ErroContacto>> = {};

  if (!f.name.trim()) erros.name = "obrigatorio";

  if (!f.email.trim()) erros.email = "obrigatorio";
  else if (!EMAIL.test(f.email)) erros.email = "email-invalido";

  if (!f.subject.trim()) erros.subject = "obrigatorio";

  if (!f.message.trim()) erros.message = "obrigatorio";
  else if (f.message.trim().length < MENSAGEM_MINIMA) erros.message = "curta";

  return erros;
}

export function contactoValido(f: DadosContacto): boolean {
  return Object.keys(validarContacto(f)).length === 0;
}
