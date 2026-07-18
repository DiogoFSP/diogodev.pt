import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Icon from "../components/Icon";
import { addMessage } from "../projectsStore";
import { useLang } from "../lang";

// Web3Forms — entrega das mensagens por email (a access key é pública)
const WEB3FORMS_KEY = "fdd122e8-4261-4e85-be7c-2216367e87b8";
const FORM_CONFIGURED = WEB3FORMS_KEY.length > 0;

type FormState = {
  name: string;
  email: string;
  subject: "geral" | "estagio" | "projeto" | "outro";
  message: string;
  honeypot: string;
};

const EMPTY_FORM: FormState = { name: "", email: "", subject: "geral", message: "", honeypot: "" };

// intervalo mínimo entre envios (por browser)
const COOLDOWN_MS = 5 * 60 * 1000;
const LAST_SENT_KEY = "diogo-last-contact";

// verifica via DNS-over-HTTPS se o domínio do email tem MX/A;
// se a própria verificação falhar, não bloqueia o envio
async function domainAcceptsEmail(email: string): Promise<boolean> {
  const domain = email.split("@")[1];
  if (!domain) return false;
  const query = async (type: "MX" | "A") => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    try {
      const res = await fetch(
        `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
        { signal: ctrl.signal }
      );
      const data = await res.json();
      return Array.isArray(data.Answer) && data.Answer.length > 0;
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    return (await query("MX")) || (await query("A"));
  } catch {
    return true;
  }
}

export default function Contact() {
  const { t, lang } = useLang();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm({ ...form, [k]: v });
  const blur = (k: keyof FormState) => setTouched({ ...touched, [k]: true });

  const errors = {
    name: !form.name.trim() ? t("Indique o seu nome.", "Please enter your name.") : null,
    email: !form.email.trim()
      ? t("Indique um email para resposta.", "Please enter an email so I can reply.")
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ? t("Esse email não parece válido.", "That email doesn't look valid.")
        : null,
    message: !form.message.trim()
      ? t("Escreva uma breve mensagem.", "Please write a short message.")
      : form.message.trim().length < 10
        ? t("Um pouco mais? (mínimo 10 caracteres)", "A bit more, please (10 characters minimum).")
        : null,
  };
  const isValid = !errors.name && !errors.email && !errors.message;

  const SUBJECT_TEXT: Record<FormState["subject"], string> = {
    geral: "Geral", estagio: "Estágio", projeto: "Projeto", outro: "Outro",
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (!isValid) return;
    // honeypot preenchido = bot
    if (form.honeypot) { setError(t("Ocorreu um erro.", "Something went wrong.")); return; }

    // cooldown
    const lastSent = Number(localStorage.getItem(LAST_SENT_KEY) || 0);
    const waitMs = COOLDOWN_MS - (Date.now() - lastSent);
    if (waitMs > 0) {
      const mins = Math.ceil(waitMs / 60000);
      setError(t(
        `Enviaste uma mensagem há pouco. Tenta de novo dentro de ${mins} min.`,
        `You just sent a message. Please try again in ${mins} min.`
      ));
      return;
    }

    setSending(true);
    setError(null);

    // MX check
    if (!(await domainAcceptsEmail(form.email.trim()))) {
      setSending(false);
      setError(t(
        "O domínio desse email não parece receber correio — confirma se está bem escrito.",
        "That email's domain doesn't seem to accept mail — please check the spelling."
      ));
      return;
    }

    // regista a mensagem (BD ou local) sem bloquear o envio por email
    try {
      await addMessage({ name: form.name.trim(), email: form.email.trim(), subject: form.subject, message: form.message.trim() });
    } catch { /* o email via Web3Forms continua a ser a entrega principal */ }

    if (FORM_CONFIGURED) {
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: WEB3FORMS_KEY,
            subject: `Novo contacto (${SUBJECT_TEXT[form.subject]}) — ${form.name.trim()}`,
            from_name: form.name.trim(),
            name: form.name.trim(),
            email: form.email.trim(),
            assunto: SUBJECT_TEXT[form.subject],
            message: form.message.trim(),
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "send failed");
      } catch {
        setSending(false);
        setError(t(
          "Não foi possível enviar agora. Tenta novamente ou escreve para diogo@diogodev.pt.",
          "Couldn't send right now. Please try again or email diogo@diogodev.pt."
        ));
        return;
      }
    } else {
      await new Promise((r) => setTimeout(r, 700));
    }

    try { localStorage.setItem(LAST_SENT_KEY, String(Date.now())); } catch { /* sem storage, sem cooldown */ }
    setSending(false);
    setSent(true);
  };

  const reset = () => {
    setForm(EMPTY_FORM);
    setTouched({});
    setSent(false);
    setError(null);
  };

  if (sent) return <ContactSuccess name={form.name} onAnother={reset} />;

  const charsLeft = 500 - form.message.length;

  return (
    <main style={{ animation: "fadeIn 380ms var(--ease-out)" }}>
      <section style={{ padding: "100px 0 60px" }}>
        <div className="container">
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18 }}>/{t("contacto", "contact")}</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(44px, 6.5vw, 88px)", lineHeight: 0.98, letterSpacing: "-0.03em", fontWeight: 300, margin: 0, maxWidth: 980, textWrap: "balance" }}>
            <span style={{ color: "var(--fg)" }}>{t("Vamos", "Let's")}</span>{" "}
            <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 400 }}>{t("conversar", "talk")}</em>.
          </h1>
          <p style={{ fontSize: 16, color: "var(--fg-2)", marginTop: 24, maxWidth: 640, lineHeight: 1.6 }}>
            {t(
              "Disponível para estágios curriculares e profissionais e colaborações em projetos.",
              "Available for curricular and professional internships, and for project collaborations."
            )}
          </p>
        </div>
      </section>

      <div className="container contact-grid" style={{ paddingBottom: 100 }}>
        <form onSubmit={onSubmit} style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: -4 }}>
            {t("mensagem", "message")} · {new Date().toLocaleDateString(lang === "en" ? "en-GB" : "pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
          </div>

          <div className="two-col">
            <Field label={t("nome", "name")} error={touched.name ? errors.name : null}>
              <input className="input" value={form.name} onChange={(e) => update("name", e.target.value)} onBlur={() => blur("name")} placeholder={t("Primeiro e último nome", "First and last name")} />
            </Field>
            <Field label="email" error={touched.email ? errors.email : null}>
              <input type="email" className="input mono" value={form.email} onChange={(e) => update("email", e.target.value)} onBlur={() => blur("email")} placeholder={t("nome@domínio.pt", "name@domain.com")} />
            </Field>
          </div>

          <Field label={t("assunto", "subject")}>
            <SubjectPicker value={form.subject} onChange={(v) => update("subject", v)} />
          </Field>

          <Field
            label={t("mensagem", "message")}
            error={touched.message ? errors.message : null}
            extra={<span className="mono" style={{ fontSize: 10, color: charsLeft < 50 ? "var(--warn)" : "var(--fg-4)" }}>{charsLeft} {t("car.", "chars")}</span>}
          >
            <textarea
              className="textarea"
              value={form.message}
              maxLength={500}
              onChange={(e) => update("message", e.target.value)}
              onBlur={() => blur("message")}
              rows={6}
              style={{ minHeight: 140, fontFamily: "var(--font-display)", fontSize: 14, lineHeight: 1.5 }}
              placeholder={t(
                "Descreva o contexto da mensagem — oportunidade, projeto ou colaboração pretendida.",
                "Describe the context of your message — opportunity, project, or collaboration."
              )}
            />
          </Field>

          {/* honeypot */}
          <input type="text" name="company" value={form.honeypot} onChange={(e) => update("honeypot", e.target.value)} tabIndex={-1} autoComplete="off" style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }} />

          {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--line)", marginTop: 4, paddingTop: 16 }}>
            <span className="mono" style={{ fontSize: 11, color: "var(--fg-4)" }}>
              {t("A mensagem é enviada diretamente para o meu email.", "Your message is sent straight to my inbox.")}
            </span>
            <button type="submit" disabled={sending} className="btn btn-primary" style={{ minWidth: 160, justifyContent: "center", opacity: sending ? 0.7 : 1, cursor: sending ? "wait" : "pointer" }}>
              {sending
                ? <><Spinner /> {t("a enviar…", "sending…")}</>
                : <><Icon name="arrowRight" size={14} /> {t("enviar mensagem", "send message")}</>}
            </button>
          </div>
        </form>

        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <InfoCard icon="github" title={t("Outros canais", "Other channels")} lines={[
            <a key="gh" href="https://github.com/DiogoFSP" target="_blank" rel="noopener" style={{ color: "var(--fg-2)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>github.com/DiogoFSP <Icon name="external" size={11} /></a>,
            <a key="li" href="https://www.linkedin.com/in/diogofspinto17/" target="_blank" rel="noopener" style={{ color: "var(--fg-2)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>linkedin.com/in/diogofspinto17 <Icon name="external" size={11} /></a>,
            <a key="m" href="mailto:diogo@diogodev.pt" style={{ color: "var(--fg-2)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>diogo@diogodev.pt <Icon name="arrowUpRight" size={11} /></a>,
          ]} />
          <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--success)", boxShadow: "0 0 8px var(--success)", animation: "pulseSoft 2s ease-in-out infinite" }} />
              {t("disponível para", "available for")}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--fg-2)", lineHeight: 1.9 }}>
              <li>{t("Estágios curriculares e profissionais", "Curricular and professional internships")}</li>
              <li>{t("Colaborações em projetos", "Project collaborations")}</li>
            </ul>
          </div>
        </aside>
      </div>

      <Footer />
    </main>
  );
}

function SubjectPicker({ value, onChange }: { value: FormState["subject"]; onChange: (v: FormState["subject"]) => void }) {
  const { t } = useLang();
  const opts: Array<{ v: FormState["subject"]; label: string; icon: string }> = [
    { v: "geral", label: t("Geral", "General"), icon: "spark" },
    { v: "estagio", label: t("Estágio", "Internship"), icon: "layers" },
    { v: "projeto", label: t("Projeto", "Project"), icon: "code" },
    { v: "outro", label: t("Outro", "Other"), icon: "dot" },
  ];
  return (
    <div className="subject-grid">
      {opts.map((o) => {
        const active = value === o.v;
        return (
          <button key={o.v} type="button" onClick={() => onChange(o.v)} style={{
            padding: "12px 10px",
            background: active ? "var(--bg-2)" : "var(--bg-1)",
            border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
            borderRadius: "var(--r-md)",
            color: active ? "var(--fg)" : "var(--fg-3)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            transition: "all 140ms var(--ease-out)",
            boxShadow: active ? "0 0 0 3px var(--accent-soft)" : "none",
          }}>
            <Icon name={o.icon} size={14} />
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, error, extra, children }: { label: string; error?: string | null; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "var(--fg-2)" }}>{label}</span>
        {extra ? extra : error && <span style={{ fontSize: 11, color: "var(--danger)" }}>{error}</span>}
      </div>
      <div style={{ position: "relative" }}>{children}</div>
      {extra && error && <div style={{ marginTop: 4, fontSize: 11, color: "var(--danger)" }}>{error}</div>}
    </label>
  );
}

function InfoCard({ icon, title, lines }: { icon: string; title: string; lines: React.ReactNode[] }) {
  return (
    <div style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, color: "var(--accent)" }}>
        <Icon name={icon} size={14} />
        <span className="mono" style={{ fontSize: 10, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{title}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6 }}>
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

function ContactSuccess({ name, onAnother }: { name: string; onAnother: () => void }) {
  const navigate = useNavigate();
  const { t } = useLang();
  return (
    <main style={{ animation: "fadeIn 420ms var(--ease-out)", minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center" }}>
      <div className="container" style={{ maxWidth: 700, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: 999, background: "var(--accent-soft)", border: "1px solid var(--accent)", color: "var(--accent)", marginBottom: 32 }}>
          <Icon name="check" size={28} />
        </div>
        <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 300, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.05, textWrap: "balance" }}>
          {t("Mensagem enviada", "Message sent")}{name ? `, ${name.split(" ")[0]}` : ""}.
        </h1>
        <p style={{ fontSize: 16, color: "var(--fg-2)", marginTop: 24, lineHeight: 1.6 }}>
          {t("Recebi a sua mensagem e responderei o mais brevemente possível.", "I've received your message and will reply as soon as I can.")}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 36 }}>
          <button className="btn" onClick={onAnother}>
            <Icon name="edit" size={14} /> {t("enviar outra", "send another")}
          </button>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            <Icon name="arrowRight" size={14} /> {t("voltar ao início", "back to home")}
          </button>
        </div>
      </div>
    </main>
  );
}
