import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Icon from "../components/Icon";
import SmartLink from "../components/SmartLink";
import { useLang } from "../lang";
import { useProjects } from "../projectsStore";
import NotFound from "./NotFound";

type Comando = { label: string; cmd: string };

// projetos que correm no browser mostram-se embebidos; os que só correm
// no computador do visitante mostram um guia de instalação
type Demo =
  | { tipo: "jogo"; titulo: [string, string]; intro: [string, string]; url: string }
  | { tipo: "guia"; titulo: [string, string]; intro: [string, string]; instalar: Comando[]; correr: Comando[]; fonte: string };

// só os projetos listados aqui têm página /demo; os outros caem no 404
const DEMOS = new Map<string, Demo>([
  [
    "4-in-line",
    {
      tipo: "jogo",
      titulo: ["Jogar", "Play"],
      intro: [
        "O jogo corre aqui mesmo, no browser. Escolha um modo e comece — não precisa de instalar nada.",
        "The game runs right here in your browser. Pick a mode and start — nothing to install.",
      ],
      url: "https://diogofsp.github.io/LS-4-em-linha-Especial/",
    },
  ],
  [
    "deepsea",
    {
      tipo: "guia",
      titulo: ["Como Jogar", "How to Play"],
      intro: [
        "Instale as dependências necessárias (JDK e Maven) e execute a versão mais recente do jogo no seu computador.",
        "Install the required dependencies (JDK and Maven) and run the latest version of the game on your computer.",
      ],
      instalar: [
        { label: "Windows (PowerShell)", cmd: "winget install Oracle.JDK.21\nwinget install Apache.Maven" },
        { label: "macOS (Homebrew)", cmd: "brew install openjdk@21\nbrew install maven" },
        { label: "Linux (Ubuntu / Debian)", cmd: "sudo apt update && sudo apt install -y openjdk-21-jdk openjdk-21-jre maven" },
      ],
      correr: [
        {
          label: "Windows (PowerShell)",
          cmd: 'Invoke-WebRequest -Uri "https://github.com/DiogoFSP/DeepSeaMining/releases/latest/download/DeepSeaMining-1.0-SNAPSHOT.jar" -OutFile "DeepSeaMining-1.0-SNAPSHOT.jar"\njava -jar DeepSeaMining-1.0-SNAPSHOT.jar',
        },
        {
          label: "macOS / Linux",
          cmd: 'curl -L -O "https://github.com/DiogoFSP/DeepSeaMining/releases/latest/download/DeepSeaMining-1.0-SNAPSHOT.jar"\njava -jar DeepSeaMining-1.0-SNAPSHOT.jar',
        },
      ],
      fonte: "git clone https://github.com/DiogoFSP/DeepSeaMining.git\ncd DeepSeaMining\nmvn clean package\njava -jar target/DeepSeaMining-1.0-SNAPSHOT.jar",
    },
  ],
]);

export default function ProjectDemo() {
  const { slug } = useParams();
  const { t } = useLang();
  const { projects, loading } = useProjects();
  const [copiado, setCopiado] = useState<string | null>(null);

  const demo = slug ? DEMOS.get(slug) : undefined;
  const project = projects.find((p) => p.slug === slug || p.id === slug);

  const copiar = (cmd: string) => {
    navigator.clipboard.writeText(cmd).then(
      () => {
        setCopiado(cmd);
        setTimeout(() => setCopiado((atual) => (atual === cmd ? null : atual)), 2000);
      },
      () => {}
    );
  };

  if (!demo) return <NotFound />;
  if (loading) return <main style={{ minHeight: "60vh" }} />;
  if (!project) return <NotFound />;

  const bloco = (c: Comando) => (
    <Bloco key={c.label} label={c.label} cmd={c.cmd} copiado={copiado === c.cmd} onCopy={() => copiar(c.cmd)} />
  );

  return (
    <main style={{ animation: "fadeIn 380ms var(--ease-out)" }}>
      <div className="container" style={{ paddingTop: 28, paddingBottom: 8 }}>
        <Link
          to={`/projeto/${project.slug}`}
          className="mono"
          style={{ color: "var(--fg-3)", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--fg)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-3)")}
        >
          <Icon name="chevronLeft" size={12} /> {t("voltar ao projeto", "back to project")}
        </Link>
      </div>

      <section style={{ padding: "24px 0 32px" }}>
        <div className="container">
          <div className="mono" style={{ fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: project.accent }} />
            {demo.tipo === "jogo" ? t("JOGAR NO BROWSER", "PLAY IN THE BROWSER") : t("GUIA DE EXECUÇÃO", "EXECUTION GUIDE")}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
            <div>
              <h1 style={{ fontSize: "clamp(32px, 4vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 400, margin: 0 }}>
                {project.title} — {t(...demo.titulo)}
              </h1>
              <p style={{ fontSize: 16, color: "var(--fg-2)", lineHeight: 1.5, marginTop: 12, marginBottom: 0, maxWidth: 640 }}>
                {t(...demo.intro)}
              </p>
            </div>

            {project.github && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <a className="btn btn-primary" href={project.github} target="_blank" rel="noopener">
                  <Icon name="github" size={14} /> {t("GitHub Repositório", "GitHub Repository")}
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container" style={{ marginBottom: 100 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {demo.tipo === "jogo" ? (
            <div>
              <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--bg-1)", boxShadow: "var(--shadow-1)" }}>
                <iframe
                  src={demo.url}
                  title={`${project.title} — ${t(...demo.titulo)}`}
                  allow="fullscreen"
                  style={{ display: "block", width: "100%", aspectRatio: "16 / 10", minHeight: 520, border: 0 }}
                />
              </div>
              <p className="mono" style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 12, marginBottom: 0 }}>
                {t("Pouco espaço? ", "Feeling cramped? ")}
                <SmartLink href={demo.url} style={{ color: "var(--accent)", textDecoration: "none" }}>
                  {t("abrir o jogo em ecrã inteiro", "open the game full screen")}
                </SmartLink>
              </p>
            </div>
          ) : (
            <>
              <Passo
                numero={1}
                cor="#3498DB"
                titulo={t("PASSO 1: Instalar o JDK 21 e o Maven", "STEP 1: Install JDK 21 and Maven")}
                descricao={t(
                  "Se ainda não tem o Java e o Maven instalados, execute o comando para o seu sistema operativo:",
                  "If you don't have Java and Maven installed, run the command for your OS:"
                )}
                minimoColuna={300}
              >
                {demo.instalar.map(bloco)}
              </Passo>

              <Passo
                numero={2}
                cor="#27C93F"
                titulo={t("PASSO 2: Descarregar a Release e Executar o Jogo", "STEP 2: Download Release & Run Game")}
                descricao={t("Obtenha a versão executável diretamente do GitHub e jogue:", "Fetch the executable directly from GitHub and play:")}
                minimoColuna={320}
              >
                {demo.correr.map(bloco)}
              </Passo>

              <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-lg)", background: "var(--bg-1)", padding: 24, boxShadow: "var(--shadow-1)" }}>
                <Bloco
                  label={`💡 ${t("COMPILAR A PARTIR DO CÓDIGO-FONTE", "BUILD FROM SOURCE CODE")}`}
                  cmd={demo.fonte}
                  copiado={copiado === demo.fonte}
                  onCopy={() => copiar(demo.fonte)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}

function Passo({ numero, cor, titulo, descricao, minimoColuna, children }: { numero: number; cor: string; titulo: string; descricao: string; minimoColuna: number; children: ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-lg)", background: "var(--bg-1)", padding: 28, boxShadow: "var(--shadow-1)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `color-mix(in srgb, ${cor} 12%, transparent)`,
            color: cor,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {numero}
        </span>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>{titulo}</h2>
          <p style={{ color: "var(--fg-3)", fontSize: 14, margin: "4px 0 0" }}>{descricao}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${minimoColuna}px, 1fr))`, gap: 16, marginTop: 20 }}>
        {children}
      </div>
    </div>
  );
}

function Bloco({ label, cmd, copiado, onCopy }: { label: string; cmd: string; copiado: boolean; onCopy: () => void }) {
  const { t } = useLang();
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "8px 12px", background: "var(--bg-2)", border: "1px solid var(--line)", borderBottom: "none", borderTopLeftRadius: "var(--r-md)", borderTopRightRadius: "var(--r-md)" }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>{label}</span>
        <button
          onClick={onCopy}
          style={{ background: "none", border: "none", padding: 0, color: copiado ? "#27C93F" : "var(--accent)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
        >
          <Icon name={copiado ? "check" : "copy"} size={13} />
          {copiado ? t("Copiado!", "Copied!") : t("Copiar", "Copy")}
        </button>
      </div>
      <pre
        className="mono"
        style={{ margin: 0, padding: 14, background: "#030712", color: "#38BDF8", border: "1px solid var(--line)", borderBottomLeftRadius: "var(--r-md)", borderBottomRightRadius: "var(--r-md)", fontSize: 12, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap" }}
      >
        <code>{cmd}</code>
      </pre>
    </div>
  );
}
