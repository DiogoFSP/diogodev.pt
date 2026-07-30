export const SITE = "https://diogodev.pt";
export const IMAGEM_OMISSAO = `${SITE}/og-image.png`;

export const escapar = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const loc = (v, lang = "en") => (v == null ? "" : typeof v === "object" ? v[lang] || v.pt || v.en || "" : v);

export function cortar(texto, max = 200) {
  const limpo = texto.replace(/\s+/g, " ").trim();
  if (limpo.length <= max) return limpo;
  return limpo.slice(0, limpo.lastIndexOf(" ", max - 1)) + "…";
}

export function substituir(html, padrao, novo) {
  if (!padrao.test(html)) throw new Error(`tag não encontrada no index.html: ${padrao}`);
  return html.replace(padrao, novo);
}

export function paginaDoProjeto(base, p) {
  const titulo = `${p.title} — Diogo Pinto`;
  const descricao = cortar(loc(p.summary) || loc(p.tagline) || "");
  const url = `${SITE}/projeto/${p.slug}`;
  const imagem = Array.isArray(p.gallery) && p.gallery[0] ? p.gallery[0] : IMAGEM_OMISSAO;
  const alt = `${p.title} — ${loc(p.tagline) || "projeto"}`;

  let html = base;
  html = substituir(html, /<title>[\s\S]*?<\/title>/, `<title>${escapar(titulo)}</title>`);
  html = substituir(html, /(<meta name="description" content=")[^"]*(")/, `$1${escapar(descricao)}$2`);
  html = substituir(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${escapar(url)}$2`);
  html = substituir(html, /(<meta property="og:type" content=")[^"]*(")/, `$1article$2`);
  html = substituir(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${escapar(titulo)}$2`);
  html = substituir(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${escapar(descricao)}$2`);
  html = substituir(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${escapar(url)}$2`);
  html = substituir(html, /(<meta property="og:image" content=")[^"]*(")/, `$1${escapar(imagem)}$2`);
  html = substituir(html, /(<meta property="og:image:alt" content=")[^"]*(")/, `$1${escapar(alt)}$2`);
  html = substituir(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapar(titulo)}$2`);
  html = substituir(html, /(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapar(descricao)}$2`);
  html = substituir(html, /(<meta name="twitter:image" content=")[^"]*(")/, `$1${escapar(imagem)}$2`);

  if (imagem !== IMAGEM_OMISSAO) {
    html = html.replace(/\s*<meta property="og:image:(width|height)" content="\d+" \/>/g, "");
  }
  return html;
}
