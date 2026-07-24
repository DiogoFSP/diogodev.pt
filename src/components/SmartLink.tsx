import type { AnchorHTMLAttributes } from "react";
import { Link } from "react-router-dom";

// href começado por "/" é uma rota do site (navega sem recarregar);
// o resto é externo e abre em separador novo
export default function SmartLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  if (href.startsWith("/")) {
    return <Link to={href} {...rest}>{children}</Link>;
  }
  return <a href={href} target="_blank" rel="noopener" {...rest}>{children}</a>;
}
