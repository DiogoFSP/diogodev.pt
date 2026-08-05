import { useState } from "react";
import Icon from "../components/Icon";
import type { LocPair } from "../demoForm";
import { setSetting, useSetting } from "../projectsStore";
import { CHAVE_SOBRE, fromSobreForm, lerSobre, toSobreForm, type SobreForm } from "../sobre";

const PAR_VAZIO = (): LocPair => ({ pt: "", en: "" });

export default function SobreView() {
  const { value, loading, refresh } = useSetting(CHAVE_SOBRE);
  const [rascunho, setRascunho] = useState<SobreForm | null>(null);
  const [editLang, setEditLang] = useState<"pt" | "en">("pt");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const f = rascunho ?? toSobreForm(lerSobre(value));
  const alterar = (novo: Partial<SobreForm>) => {
    setRascunho({ ...f, ...novo });
    setGuardado(false);
  };

  const guardar = async () => {
    setBusy(true);
    setErro(null);
    try {
      await setSetting(CHAVE_SOBRE, JSON.stringify(fromSobreForm(f)));
      refresh();
      setRascunho(null);
      setGuardado(true);
    } catch {
      setErro("Não foi possível guardar — tentar novamente.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div style={{ color: "var(--fg-3)" }}>a carregar…</div>;

  const campo = (par: LocPair, aoMudar: (p: LocPair) => void, opcoes: OpcoesCampo = {}) => (
    <CampoLoc par={par} aoMudar={aoMudar} editLang={editLang} {...opcoes} />
  );

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>/sobre</div>
      <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 400, letterSpacing: "-0.02em" }}>Página sobre</h2>
      <p style={{ color: "var(--fg-3)", fontSize: 13, marginTop: 0, marginBottom: 24 }}>
        Tudo o que aparece em <a href="/sobre" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>diogodev.pt/sobre</a>.
        A lista "disponível para" também alimenta o cartão da página de contacto. Uma secção deixada sem linhas desaparece do site.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {([["pt", "português"], ["en", "english"]] as const).map(([v, label]) => (
          <button key={v} type="button" onClick={() => setEditLang(v)} style={{ background: editLang === v ? "var(--bg-2)" : "var(--bg-1)", border: `1px solid ${editLang === v ? "var(--accent)" : "var(--line)"}`, borderRadius: "var(--r-md)", padding: "10px", cursor: "pointer", color: editLang === v ? "var(--fg)" : "var(--fg-3)", fontSize: 13 }}>
            {label}
          </button>
        ))}
      </div>

      <Bloco titulo="Entrada" nota="A frase grande, logo abaixo do nome.">
        {campo(f.intro, (p) => alterar({ intro: p }), { area: true, placeholder: "Estudante de Engenharia Informática no ISEC…" })}
      </Bloco>

      <Bloco
        titulo="Bio"
        nota="Um parágrafo por caixa."
        aoAdicionar={() => alterar({ bio: [...f.bio, PAR_VAZIO()] })}
        rotuloAdicionar="parágrafo"
      >
        {f.bio.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            {campo(p, (novo) => alterar({ bio: f.bio.map((x, j) => (j === i ? novo : x)) }), { area: true })}
            <Remover aoRemover={() => alterar({ bio: f.bio.filter((_, j) => j !== i) })} />
          </div>
        ))}
      </Bloco>

      <Bloco
        titulo="Disponível para"
        nota="Aparece com o ponto verde, em /sobre e no contacto."
        aoAdicionar={() => alterar({ disponivel: [...f.disponivel, PAR_VAZIO()] })}
        rotuloAdicionar="linha"
      >
        {f.disponivel.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            {campo(p, (novo) => alterar({ disponivel: f.disponivel.map((x, j) => (j === i ? novo : x)) }), { placeholder: "Estágio curricular — 2.º semestre de 2026/27" })}
            <Remover aoRemover={() => alterar({ disponivel: f.disponivel.filter((_, j) => j !== i) })} />
          </div>
        ))}
      </Bloco>

      <Bloco
        titulo="Em resumo"
        nota="Pares rótulo/valor do cartão lateral."
        aoAdicionar={() => alterar({ resumo: [...f.resumo, { rotulo: PAR_VAZIO(), valor: PAR_VAZIO() }] })}
        rotuloAdicionar="linha"
      >
        {f.resumo.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            {campo(r.rotulo, (novo) => alterar({ resumo: f.resumo.map((x, j) => (j === i ? { ...x, rotulo: novo } : x)) }), { placeholder: "localização", mono: true, estilo: { maxWidth: 170 } })}
            {campo(r.valor, (novo) => alterar({ resumo: f.resumo.map((x, j) => (j === i ? { ...x, valor: novo } : x)) }), { placeholder: "Coimbra, Portugal" })}
            <Remover aoRemover={() => alterar({ resumo: f.resumo.filter((_, j) => j !== i) })} />
          </div>
        ))}
      </Bloco>

      <Bloco
        titulo="Competências"
        nota="Um grupo por linha; as tecnologias separam-se por vírgulas."
        aoAdicionar={() => alterar({ competencias: [...f.competencias, { rotulo: PAR_VAZIO(), itens: "" }] })}
        rotuloAdicionar="grupo"
      >
        {f.competencias.map((g, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            {campo(g.rotulo, (novo) => alterar({ competencias: f.competencias.map((x, j) => (j === i ? { ...x, rotulo: novo } : x)) }), { placeholder: "linguagens", mono: true, estilo: { maxWidth: 170 } })}
            <input
              className="input"
              value={g.itens}
              placeholder="TypeScript, Java, C"
              onChange={(e) => alterar({ competencias: f.competencias.map((x, j) => (j === i ? { ...x, itens: e.target.value } : x)) })}
            />
            <Remover aoRemover={() => alterar({ competencias: f.competencias.filter((_, j) => j !== i) })} />
          </div>
        ))}
      </Bloco>

      <Bloco
        titulo="Experiência"
        nota="Estágios e trabalho. Sem empresa, a entrada não é guardada."
        aoAdicionar={() => alterar({ experiencia: [...f.experiencia, { empresa: "", cargo: PAR_VAZIO(), meta: PAR_VAZIO(), pontos: [PAR_VAZIO()] }] })}
        rotuloAdicionar="entrada"
      >
        {f.experiencia.map((e, i) => {
          const mudar = (novo: Partial<(typeof f.experiencia)[number]>) =>
            alterar({ experiencia: f.experiencia.map((x, j) => (j === i ? { ...x, ...novo } : x)) });
          return (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 14, display: "flex", flexDirection: "column", gap: 8, background: "var(--bg-1)" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" style={{ maxWidth: 170 }} value={e.empresa} placeholder="LOBA" onChange={(ev) => mudar({ empresa: ev.target.value })} />
                {campo(e.cargo, (novo) => mudar({ cargo: novo }), { placeholder: "Programador Web — Estágio" })}
                <Remover aoRemover={() => alterar({ experiencia: f.experiencia.filter((_, j) => j !== i) })} />
              </div>
              {campo(e.meta, (novo) => mudar({ meta: novo }), { placeholder: "2024 · Oliveira de Azeméis", mono: true })}
              {e.pontos.map((p, k) => (
                <div key={k} style={{ display: "flex", gap: 8 }}>
                  {campo(p, (novo) => mudar({ pontos: e.pontos.map((x, m) => (m === k ? novo : x)) }), { placeholder: "O que fez lá." })}
                  <Remover aoRemover={() => mudar({ pontos: e.pontos.filter((_, m) => m !== k) })} />
                </div>
              ))}
              <button type="button" className="btn btn-ghost mono" style={{ fontSize: 11, alignSelf: "flex-start" }} onClick={() => mudar({ pontos: [...e.pontos, PAR_VAZIO()] })}>
                <Icon name="plus" size={12} /> ponto
              </button>
            </div>
          );
        })}
      </Bloco>

      <Bloco
        titulo="Formação"
        nota="A nota é opcional e sai como etiqueta cor de âmbar."
        aoAdicionar={() => alterar({ formacao: [...f.formacao, { curso: PAR_VAZIO(), escola: PAR_VAZIO(), meta: PAR_VAZIO(), nota: "" }] })}
        rotuloAdicionar="curso"
      >
        {f.formacao.map((c, i) => {
          const mudar = (novo: Partial<(typeof f.formacao)[number]>) =>
            alterar({ formacao: f.formacao.map((x, j) => (j === i ? { ...x, ...novo } : x)) });
          return (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 14, display: "flex", flexDirection: "column", gap: 8, background: "var(--bg-1)" }}>
              <div style={{ display: "flex", gap: 8 }}>
                {campo(c.curso, (novo) => mudar({ curso: novo }), { placeholder: "Licenciatura em Engenharia Informática" })}
                <input className="input mono" style={{ maxWidth: 90 }} value={c.nota} placeholder="18/20" onChange={(ev) => mudar({ nota: ev.target.value })} />
                <Remover aoRemover={() => alterar({ formacao: f.formacao.filter((_, j) => j !== i) })} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {campo(c.escola, (novo) => mudar({ escola: novo }), { placeholder: "Instituto Superior de Engenharia de Coimbra (ISEC)" })}
                {campo(c.meta, (novo) => mudar({ meta: novo }), { placeholder: "2024 — 2027 (previsto)", mono: true, estilo: { maxWidth: 190 } })}
              </div>
            </div>
          );
        })}
      </Bloco>

      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap", position: "sticky", bottom: 0, background: "var(--bg)", paddingTop: 12, paddingBottom: 4 }}>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={guardar}>
          <Icon name="check" size={14} /> {busy ? "a guardar…" : "guardar"}
        </button>
        {rascunho && (
          <button type="button" className="btn btn-ghost mono" style={{ fontSize: 11 }} onClick={() => { setRascunho(null); setGuardado(false); }}>
            descartar alterações
          </button>
        )}
        {guardado && <span className="mono" style={{ fontSize: 12, color: "var(--success)", alignSelf: "center" }}>guardado</span>}
        {erro && <span className="mono" style={{ fontSize: 12, color: "var(--danger)", alignSelf: "center" }}>{erro}</span>}
      </div>
    </div>
  );
}

function Bloco({ titulo, nota, children, aoAdicionar, rotuloAdicionar }: { titulo: string; nota: string; children: React.ReactNode; aoAdicionar?: () => void; rotuloAdicionar?: string }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>{titulo}</h3>
        <span className="mono" style={{ fontSize: 10.5, color: "var(--fg-4)" }}>{nota}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
      {aoAdicionar && (
        <button type="button" className="btn btn-ghost mono" style={{ fontSize: 11, marginTop: 10 }} onClick={aoAdicionar}>
          <Icon name="plus" size={12} /> {rotuloAdicionar}
        </button>
      )}
    </section>
  );
}

type OpcoesCampo = { placeholder?: string; area?: boolean; mono?: boolean; estilo?: React.CSSProperties };

function CampoLoc({ par, aoMudar, editLang, placeholder, area, mono, estilo }: OpcoesCampo & { par: LocPair; aoMudar: (p: LocPair) => void; editLang: "pt" | "en" }) {
  const dica = editLang === "en" && par.pt ? par.pt : placeholder;
  const comuns = {
    value: par[editLang],
    placeholder: dica,
    style: estilo,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => aoMudar({ ...par, [editLang]: e.target.value }),
  };
  return area ? (
    <textarea className="textarea" rows={3} {...comuns} />
  ) : (
    <input className={mono ? "input mono" : "input"} {...comuns} />
  );
}

function Remover({ aoRemover }: { aoRemover: () => void }) {
  return (
    <button type="button" className="btn btn-icon" title="remover" onClick={aoRemover} style={{ flexShrink: 0 }}>
      <Icon name="trash" size={13} />
    </button>
  );
}
