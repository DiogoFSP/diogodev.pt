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

export function paginaSimples(base, { titulo, descricao, url, imagem = IMAGEM_OMISSAO }) {
  let html = base;
  html = substituir(html, /<title>[\s\S]*?<\/title>/, `<title>${escapar(titulo)}</title>`);
  html = substituir(html, /(<meta name="description" content=")[^"]*(")/, `$1${escapar(descricao)}$2`);
  html = substituir(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${escapar(url)}$2`);
  html = substituir(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${escapar(titulo)}$2`);
  html = substituir(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${escapar(descricao)}$2`);
  html = substituir(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${escapar(url)}$2`);
  html = substituir(html, /(<meta property="og:image" content=")[^"]*(")/, `$1${escapar(imagem)}$2`);
  html = substituir(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapar(titulo)}$2`);
  html = substituir(html, /(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapar(descricao)}$2`);
  html = substituir(html, /(<meta name="twitter:image" content=")[^"]*(")/, `$1${escapar(imagem)}$2`);
  return html;
}

export function paginaDoProjeto(base, p, temImagem = false) {
  const titulo = `${p.title} — Diogo Pinto`;
  const descricao = cortar(loc(p.summary) || loc(p.tagline) || "");
  const url = `${SITE}/projeto/${p.slug}`;
  const imagem = temImagem ? `${SITE}/og/${p.slug}.png` : IMAGEM_OMISSAO;
  const alt = `${p.title} — ${loc(p.tagline) || "projeto"}`;

  let html = paginaSimples(base, { titulo, descricao, url, imagem });
  html = substituir(html, /(<meta property="og:type" content=")[^"]*(")/, `$1article$2`);
  html = substituir(html, /(<meta property="og:image:alt" content=")[^"]*(")/, `$1${escapar(alt)}$2`);

  return html;
}

export function paginaDaDemo(base, p, temImagem = false) {
  const nome = loc(p.demo_config?.titulo) || "Demo";
  const titulo = `${p.title} — ${nome}`;
  const descricao = cortar(`${nome}: ${loc(p.summary) || loc(p.tagline) || p.title}`);
  const url = `${SITE}/projeto/${p.slug}/demo`;
  const imagem = temImagem ? `${SITE}/og/${p.slug}.png` : IMAGEM_OMISSAO;
  return paginaSimples(base, { titulo, descricao, url, imagem });
}

export function sitemap(urls) {
  const linhas = urls.map((u) => `  <url><loc>${escapar(u)}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${linhas}\n</urlset>\n`;
}
