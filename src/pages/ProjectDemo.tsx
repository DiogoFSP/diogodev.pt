import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Icon from "../components/Icon";
import SmartLink from "../components/SmartLink";
import { useLang } from "../lang";
import { useProjects } from "../projectsStore";
import NotFound from "./NotFound";

// label e cmd são um par [pt, en] quando há texto a traduzir
type Comando = { label: string | [string, string]; cmd: string | [string, string] };
type PassoGuia = {
  cor: string;
  titulo: [string, string];
  descricao: [string, string];
  minimoColuna: number;
  blocos: Comando[];
};

// projetos que correm no browser mostram-se embebidos; os que só correm
// no computador do visitante mostram um guia de instalação
type Demo =
  | { tipo: "embebido"; etiqueta: [string, string]; titulo: [string, string]; intro: [string, string]; url: string }
  | { tipo: "guia"; titulo: [string, string]; intro: [string, string]; passos: PassoGuia[]; fonte?: Comando };

// só os projetos listados aqui têm página /demo; os outros caem no 404
const DEMOS = new Map<string, Demo>([
  [
    "4-in-line",
    {
      tipo: "embebido",
      etiqueta: ["JOGAR NO BROWSER", "PLAY IN THE BROWSER"],
      titulo: ["Jogar", "Play"],
      intro: [
        "O jogo corre aqui mesmo, no browser. Escolha um modo e comece — não precisa de instalar nada.",
        "The game runs right here in your browser. Pick a mode and start — nothing to install.",
      ],
      url: "https://diogofsp.github.io/LS-4-em-linha-Especial/",
    },
  ],
  [
    "bitquest",
    {
      tipo: "embebido",
      etiqueta: ["O SITE AO VIVO", "THE SITE, LIVE"],
      titulo: ["Ver por dentro", "See it running"],
      intro: [
        "Este é o site do BitQuest a correr no servidor da escola, aqui dentro.",
        "This is the BitQuest site running on the school server, right here.",
      ],
      url: "https://alpha.soaresbasto.pt/~a25757/PAP/index.php",
    },
  ],
  [
    "deepsea",
    {
      tipo: "guia",
      titulo: ["Como Jogar", "How to Play"],
      intro: [
        "O jogo é feito em JavaFX e corre no seu computador. Precisa de um JDK 25 que inclua o JavaFX — o da BellSoft (Liberica Full) já vem com ele.",
        "The game is built with JavaFX and runs on your computer. You need a JDK 25 that bundles JavaFX — BellSoft's Liberica Full includes it.",
      ],
      passos: [
        {
          cor: "#3498DB",
          titulo: ["PASSO 1: Instalar um JDK 25 com JavaFX", "STEP 1: Install a JDK 25 with JavaFX"],
          descricao: [
            "Um JDK normal não traz o JavaFX. Escolha o comando do seu sistema operativo:",
            "A plain JDK does not bundle JavaFX. Pick the command for your OS:",
          ],
          minimoColuna: 300,
          blocos: [
            { label: "Windows (PowerShell)", cmd: "winget install BellSoft.LibericaJDK.25.Full" },
            { label: "macOS / Linux (SDKMAN)", cmd: "curl -s https://get.sdkman.io | bash\nsdk install java 25.0.4.fx-librca" },
            { label: "Alternativa · Alternative", cmd: "# descarregar o Liberica JDK 25 Full em:\n# https://bell-sw.com/pages/downloads/" },
          ],
        },
        {
          cor: "#27C93F",
          titulo: ["PASSO 2: Descarregar a Release e Executar o Jogo", "STEP 2: Download Release & Run Game"],
          descricao: ["Descarregue o jar do GitHub e execute:", "Download the jar from GitHub and run it:"],
          minimoColuna: 320,
          blocos: [
            {
              label: "Windows (PowerShell)",
              cmd: 'Invoke-WebRequest -Uri "https://github.com/DiogoFSP/DeepSeaMining/releases/latest/download/DeepSeaMining-1.0-SNAPSHOT.jar" -OutFile "DeepSeaMining-1.0-SNAPSHOT.jar"\njava -jar DeepSeaMining-1.0-SNAPSHOT.jar',
            },
            {
              label: "macOS / Linux",
              cmd: 'curl -L -O "https://github.com/DiogoFSP/DeepSeaMining/releases/latest/download/DeepSeaMining-1.0-SNAPSHOT.jar"\njava -jar DeepSeaMining-1.0-SNAPSHOT.jar',
            },
          ],
        },
      ],
      fonte: {
        label: ["COMPILAR A PARTIR DO CÓDIGO-FONTE", "BUILD FROM SOURCE CODE"],
        cmd: "git clone https://github.com/DiogoFSP/DeepSeaMining.git\ncd DeepSeaMining\nmvn javafx:run",
      },
    },
  ],
  [
    "tpso",
    {
      tipo: "guia",
      titulo: ["Como Executar", "How to Run"],
      intro: [
        "Só corre em Linux: são três programas em C que falam entre si por named pipes, sinais e redirecionamento de stdout — mecanismos do UNIX, sem equivalente no Windows. Vai correr o controlador num terminal e um cliente em cada um dos outros.",
        "Linux only: three C programs talking to each other through named pipes, signals and stdout redirection — UNIX mechanisms with no Windows equivalent. You will run the controller in one terminal and one client in each of the others.",
      ],
      passos: [
        {
          cor: "#27C93F",
          titulo: ["PASSO 1: Clonar e compilar", "STEP 1: Clone and build"],
          descricao: [
            "Precisa do gcc e do make. O makefile tem o target all, que limpa e compila os três executáveis: controlador, cliente e veiculo.",
            "You need gcc and make. The makefile has an all target that cleans and builds the three executables: controlador, cliente and veiculo.",
          ],
          minimoColuna: 300,
          blocos: [
            { label: "Ubuntu / Debian", cmd: "sudo apt update\nsudo apt install -y build-essential git" },
            {
              label: "Compilar · Build",
              cmd: "git clone https://github.com/DiogoFSP/TPSO.git\ncd TPSO\nmake all",
            },
          ],
        },
        {
          cor: "#F39C12",
          titulo: ["PASSO 2: Arrancar a plataforma", "STEP 2: Start the platform"],
          descricao: [
            "Dois terminais, ambos na pasta TPSO — é lá que vive o named pipe do controlador, e o cliente recusa arrancar se não o encontrar. A variável NVEICULOS define o tamanho da frota (máximo 10). Cada utilizador novo é um terminal novo com outro username.",
            "Two terminals, both inside the TPSO folder — that is where the controller's named pipe lives, and the client refuses to start without it. NVEICULOS sets the fleet size (10 max). Each new user is a new terminal with a different username.",
          ],
          minimoColuna: 300,
          blocos: [
            { label: "Terminal 1 · controlador / controller", cmd: "export NVEICULOS=3\n./controlador" },
            { label: "Terminal 2 · cliente / client", cmd: "cd TPSO\n./cliente pedro" },
          ],
        },
        {
          cor: "#9B59B6",
          titulo: ["PASSO 3: Uma viagem, do início ao fim", "STEP 3: One trip, start to finish"],
          descricao: [
            'Escreva um comando de cada vez, no terminal respetivo. A "hora" é tempo simulado: o número de segundos desde o arranque do controlador. As linhas que começam por # são notas, não são comandos.',
            'Type one command at a time, in its own terminal. "Time" is simulated: seconds since the controller started. Lines starting with # are notes, not commands.',
          ],
          minimoColuna: 340,
          blocos: [
            {
              label: "No cliente · in the client",
              cmd: [
                "# um serviço às 10s, de Coimbra, 5 km\nagendar 10 Coimbra 5\n\n# os serviços que agendei\nconsultar\n\n# quando o veículo avisar que chegou\nentrar Lisboa\n\n# opcional: sair a meio da viagem\nsair\n\n# fechar o cliente\nterminar",
                "# a trip at 10s, from Coimbra, 5 km\nagendar 10 Coimbra 5\n\n# the trips I booked\nconsultar\n\n# once the vehicle says it arrived\nentrar Lisboa\n\n# optional: leave mid-trip\nsair\n\n# close the client\nterminar",
              ],
            },
            {
              label: "No controlador · in the controller",
              cmd: [
                "listar     # serviços agendados\nutiliz     # quem está ligado\nfrota      # veículos e % do percurso\nkm         # quilómetros da frota\nhora       # tempo simulado\nterminar   # desligar tudo",
                "listar     # booked trips\nutiliz     # who is connected\nfrota      # vehicles and % done\nkm         # fleet kilometres\nhora       # simulated time\nterminar   # shut everything down",
              ],
            },
          ],
        },
      ],
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

  const bloco = (c: Comando, prefixo = "") => {
    const cmd = typeof c.cmd === "string" ? c.cmd : t(...c.cmd);
    const label = prefixo + (typeof c.label === "string" ? c.label : t(...c.label));
    return <Bloco key={label} label={label} cmd={cmd} copiado={copiado === cmd} onCopy={() => copiar(cmd)} />;
  };

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
            {demo.tipo === "embebido" ? t(...demo.etiqueta) : t("GUIA DE EXECUÇÃO", "EXECUTION GUIDE")}
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
          {demo.tipo === "embebido" ? (
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
                  {t("abrir em ecrã inteiro", "open in full screen")}
                </SmartLink>
              </p>
            </div>
          ) : (
            <>
              {demo.passos.map((passo, i) => (
                <Passo
                  key={passo.titulo[0]}
                  numero={i + 1}
                  cor={passo.cor}
                  titulo={t(...passo.titulo)}
                  descricao={t(...passo.descricao)}
                  minimoColuna={passo.minimoColuna}
                >
                  {passo.blocos.map((b) => bloco(b))}
                </Passo>
              ))}

              {demo.fonte && (
                <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-lg)", background: "var(--bg-1)", padding: 24, boxShadow: "var(--shadow-1)" }}>
                  {bloco(demo.fonte, "💡 ")}
                </div>
              )}
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
