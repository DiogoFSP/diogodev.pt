import type { AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { isSafeInternalPath, sanitizeExternalUrl } from "../security/url";

// href começado por "/" é uma rota do site (navega sem recarregar);
// o resto é externo e abre em separador novo
export default function SmartLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  if (isSafeInternalPath(href)) {
    return <Link to={href} {...rest}>{children}</Link>;
  }
  const seguro = sanitizeExternalUrl(href, { allowMailto: true, allowTel: true });
  if (!seguro) return <a {...rest}>{children}</a>;
  return <a href={seguro} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;
}
