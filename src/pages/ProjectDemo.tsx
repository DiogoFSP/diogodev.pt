import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Icon from "../components/Icon";
import { useLang } from "../lang";
import { useProjects } from "../projectsStore";

export default function ProjectDemo() {
  const { slug } = useParams();
  const { t } = useLang();
  const { projects, loading: loadingProjects } = useProjects();
  const project = projects.find((p) => p.slug === slug || p.id === slug);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (loadingProjects) return <main style={{ minHeight: "60vh" }} />;

  if (!project) {
    return (
      <main className="container" style={{ padding: "120px 0", textAlign: "center" }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--fg-4)", letterSpacing: "0.14em", marginBottom: 16 }}>
          404
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 400, letterSpacing: "-0.02em", margin: 0 }}>
          {t("Projeto não encontrado.", "Project not found.")}
        </h1>
        <Link
          to="/"
          className="mono"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 24, color: "var(--accent)", textDecoration: "none", fontSize: 13 }}
        >
          <Icon name="chevronLeft" size={13} /> {t("voltar aos projetos", "back to projects")}
        </Link>
      </main>
    );
  }

  const installWindowsCmd = `winget install Oracle.JDK.21\nwinget install Apache.Maven`;
  const installMacCmd = `brew install openjdk@21\nbrew install maven`;
  const installLinuxCmd = `sudo apt update && sudo apt install -y openjdk-21-jdk openjdk-21-jre maven`;

  const runWindowsCmd = `Invoke-WebRequest -Uri "https://github.com/DiogoFSP/DeepSeaMining/releases/latest/download/DeepSeaMining-1.0-SNAPSHOT.jar" -OutFile "DeepSeaMining-1.0-SNAPSHOT.jar"\njava -jar DeepSeaMining-1.0-SNAPSHOT.jar`;
  const runMacLinuxCmd = `curl -L -O "https://github.com/DiogoFSP/DeepSeaMining/releases/latest/download/DeepSeaMining-1.0-SNAPSHOT.jar"\njava -jar DeepSeaMining-1.0-SNAPSHOT.jar`;

  const sourceBuildCmd = `git clone https://github.com/DiogoFSP/DeepSeaMining.git\ncd DeepSeaMining\nmvn clean package\njava -jar target/DeepSeaMining-1.0-SNAPSHOT.jar`;

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
            {t("GUIA DE EXECUÇÃO", "EXECUTION GUIDE")}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
            <div>
              <h1 style={{ fontSize: "clamp(32px, 4vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.03em", fontWeight: 400, margin: 0 }}>
                {project.title} — {t("Como Jogar", "How to Play")}
              </h1>
              <p style={{ fontSize: 16, color: "var(--fg-2)", lineHeight: 1.5, marginTop: 12, marginBottom: 0, maxWidth: 640 }}>
                {t(
                  "Instale as dependências necessárias (JDK e Maven) e execute a versão mais recente do jogo no seu computador.",
                  "Install the required dependencies (JDK and Maven) and run the latest version of the game on your computer."
                )}
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {project.github && (
                <a className="btn btn-primary" href={project.github} target="_blank" rel="noopener">
                  <Icon name="github" size={14} /> {t("GitHub Repositório", "GitHub Repository")}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ marginBottom: 100 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: "var(--r-lg)",
              background: "var(--bg-1)",
              padding: 28,
              boxShadow: "var(--shadow-1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(52, 152, 219, 0.12)",
                  color: "#3498DB",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                1
              </span>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>
                  {t("PASSO 1: Instalar o JDK 21 e o Maven", "STEP 1: Install JDK 21 and Maven")}
                </h2>
                <p style={{ color: "var(--fg-3)", fontSize: 14, margin: "4px 0 0" }}>
                  {t(
                    "Se ainda não tem o Java e o Maven instalados, execute o comando para o seu sistema operativo:",
                    "If you don't have Java and Maven installed, run the command for your OS:"
                  )}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 20 }}>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-2)", border: "1px solid var(--line)", borderBottom: "none", borderTopLeftRadius: "var(--r-md)", borderTopRightRadius: "var(--r-md)" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
                    Windows (PowerShell)
                  </span>
                  <button
                    onClick={() => handleCopy(installWindowsCmd, 1)}
                    style={{ background: "none", border: "none", color: copiedIndex === 1 ? "#27C93F" : "var(--accent)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name={copiedIndex === 1 ? "check" : "copy"} size={13} />
                    {copiedIndex === 1 ? t("Copiado!", "Copied!") : t("Copiar", "Copy")}
                  </button>
                </div>
                <pre className="mono" style={{ margin: 0, padding: 14, background: "#030712", color: "#38BDF8", border: "1px solid var(--line)", borderBottomLeftRadius: "var(--r-md)", borderBottomRightRadius: "var(--r-md)", fontSize: 12, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap" }}>
                  <code>{installWindowsCmd}</code>
                </pre>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-2)", border: "1px solid var(--line)", borderBottom: "none", borderTopLeftRadius: "var(--r-md)", borderTopRightRadius: "var(--r-md)" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
                    macOS (Homebrew)
                  </span>
                  <button
                    onClick={() => handleCopy(installMacCmd, 2)}
                    style={{ background: "none", border: "none", color: copiedIndex === 2 ? "#27C93F" : "var(--accent)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name={copiedIndex === 2 ? "check" : "copy"} size={13} />
                    {copiedIndex === 2 ? t("Copiado!", "Copied!") : t("Copiar", "Copy")}
                  </button>
                </div>
                <pre className="mono" style={{ margin: 0, padding: 14, background: "#030712", color: "#38BDF8", border: "1px solid var(--line)", borderBottomLeftRadius: "var(--r-md)", borderBottomRightRadius: "var(--r-md)", fontSize: 12, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap" }}>
                  <code>{installMacCmd}</code>
                </pre>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-2)", border: "1px solid var(--line)", borderBottom: "none", borderTopLeftRadius: "var(--r-md)", borderTopRightRadius: "var(--r-md)" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
                    Linux (Ubuntu / Debian)
                  </span>
                  <button
                    onClick={() => handleCopy(installLinuxCmd, 3)}
                    style={{ background: "none", border: "none", color: copiedIndex === 3 ? "#27C93F" : "var(--accent)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name={copiedIndex === 3 ? "check" : "copy"} size={13} />
                    {copiedIndex === 3 ? t("Copiado!", "Copied!") : t("Copiar", "Copy")}
                  </button>
                </div>
                <pre className="mono" style={{ margin: 0, padding: 14, background: "#030712", color: "#38BDF8", border: "1px solid var(--line)", borderBottomLeftRadius: "var(--r-md)", borderBottomRightRadius: "var(--r-md)", fontSize: 12, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap" }}>
                  <code>{installLinuxCmd}</code>
                </pre>
              </div>

            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: "var(--r-lg)",
              background: "var(--bg-1)",
              padding: 28,
              boxShadow: "var(--shadow-1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "rgba(39, 201, 63, 0.12)",
                  color: "#27C93F",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                2
              </span>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>
                  {t("PASSO 2: Descarregar a Release e Executar o Jogo", "STEP 2: Download Release & Run Game")}
                </h2>
                <p style={{ color: "var(--fg-3)", fontSize: 14, margin: "4px 0 0" }}>
                  {t(
                    "Obtenha a versão executável diretamente do GitHub e jogue:",
                    "Fetch the executable directly from GitHub and play:"
                  )}
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginTop: 20 }}>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-2)", border: "1px solid var(--line)", borderBottom: "none", borderTopLeftRadius: "var(--r-md)", borderTopRightRadius: "var(--r-md)" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
                    Windows (PowerShell)
                  </span>
                  <button
                    onClick={() => handleCopy(runWindowsCmd, 4)}
                    style={{ background: "none", border: "none", color: copiedIndex === 4 ? "#27C93F" : "var(--accent)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name={copiedIndex === 4 ? "check" : "copy"} size={13} />
                    {copiedIndex === 4 ? t("Copiado!", "Copied!") : t("Copiar", "Copy")}
                  </button>
                </div>
                <pre className="mono" style={{ margin: 0, padding: 14, background: "#030712", color: "#38BDF8", border: "1px solid var(--line)", borderBottomLeftRadius: "var(--r-md)", borderBottomRightRadius: "var(--r-md)", fontSize: 12, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap" }}>
                  <code>{runWindowsCmd}</code>
                </pre>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-2)", border: "1px solid var(--line)", borderBottom: "none", borderTopLeftRadius: "var(--r-md)", borderTopRightRadius: "var(--r-md)" }}>
                  <span className="mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
                    macOS / Linux
                  </span>
                  <button
                    onClick={() => handleCopy(runMacLinuxCmd, 5)}
                    style={{ background: "none", border: "none", color: copiedIndex === 5 ? "#27C93F" : "var(--accent)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <Icon name={copiedIndex === 5 ? "check" : "copy"} size={13} />
                    {copiedIndex === 5 ? t("Copiado!", "Copied!") : t("Copiar", "Copy")}
                  </button>
                </div>
                <pre className="mono" style={{ margin: 0, padding: 14, background: "#030712", color: "#38BDF8", border: "1px solid var(--line)", borderBottomLeftRadius: "var(--r-md)", borderBottomRightRadius: "var(--r-md)", fontSize: 12, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap" }}>
                  <code>{runMacLinuxCmd}</code>
                </pre>
              </div>

            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--line)",
              borderRadius: "var(--r-lg)",
              background: "var(--bg-1)",
              padding: 24,
              boxShadow: "var(--shadow-1)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div className="mono" style={{ fontSize: 11, color: "var(--accent)", letterSpacing: "0.08em" }}>
                💡 {t("COMPILAR A PARTIR DO CÓDIGO-FONTE:", "BUILD FROM SOURCE CODE:")}
              </div>
              <button
                onClick={() => handleCopy(sourceBuildCmd, 6)}
                style={{ background: "none", border: "none", color: copiedIndex === 6 ? "#27C93F" : "var(--accent)", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
              >
                <Icon name={copiedIndex === 6 ? "check" : "copy"} size={13} />
                {copiedIndex === 6 ? t("Copiado!", "Copied!") : t("Copiar", "Copy")}
              </button>
            </div>

            <pre className="mono" style={{ margin: 0, padding: 14, background: "#030712", color: "#38BDF8", border: "1px solid var(--line)", borderRadius: "var(--r-md)", fontSize: 12, lineHeight: 1.5, overflowX: "auto", whiteSpace: "pre-wrap" }}>
              <code>{sourceBuildCmd}</code>
            </pre>
          </div>

        </div>
      </div>

      <Footer />
    </main>
  );
}
