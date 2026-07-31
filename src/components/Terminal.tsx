import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loc } from "../data";
import { useLang } from "../lang";
import { useProjects, useSetting } from "../projectsStore";
import { openSafeExternalUrl } from "../security/url";
import { useTheme } from "../theme";

type Linha = { tipo: "entrada" | "saida" | "aviso" | "erro"; texto: string };

const PROMPT = "diogo@diogodev:~$";

// o logo "D" em blocos, para o neofetch
const LOGO = [
  "██████╗ ",
  "██╔══██╗",
  "██║  ██║",
  "██║  ██║",
  "██████╔╝",
  "╚═════╝ ",
];

export default function Terminal({ gatilho, onSair }: { gatilho: string; onSair: () => void }) {
  const { t, lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { projects } = useProjects();
  const { value: cvUrl } = useSetting("cv_url");
  const navigate = useNavigate();

  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [valor, setValor] = useState("");
  const [historico, setHistorico] = useState<string[]>([]);
  const [posHistorico, setPosHistorico] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const fimRef = useRef<HTMLDivElement>(null);

  const visiveis = useMemo(
    () => projects.filter((p) => p.status !== "hidden"),
    [projects]
  );

  const escrever = (novas: Linha[]) => setLinhas((atual) => [...atual, ...novas]);
  const saida = (...textos: string[]): Linha[] => textos.map((texto) => ({ tipo: "saida", texto }));

  // a piada do sudo só aparece a quem escreveu 'sudo'
  useEffect(() => {
    const abertura = gatilho === "sudo"
      ? t("Sessão iniciada. Não há sudo nenhum aqui, mas obrigado por tentar.", "Session started. There is no actual sudo here, but thanks for trying.")
      : t("Sessão iniciada em diogodev.pt.", "Session started on diogodev.pt.");
    setLinhas([
      { tipo: "aviso", texto: abertura },
      { tipo: "saida", texto: t("Escreve 'help' para ver o que existe, 'exit' para sair.", "Type 'help' to see what's here, 'exit' to leave.") },
    ]);
    setTimeout(() => inputRef.current?.focus(), 40);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [linhas]);

  const encontrarProjeto = (nome: string) =>
    visiveis.find(
      (p) => p.slug.toLowerCase() === nome || p.id.toLowerCase() === nome || p.title.toLowerCase() === nome
    );

  const correr = (bruto: string) => {
    const cru = bruto.trim();
    escrever([{ tipo: "entrada", texto: cru }]);
    if (!cru) return;

    setHistorico((h) => [cru, ...h].slice(0, 50));
    setPosHistorico(-1);

    const partes = cru.split(/\s+/);
    const cmd = partes[0].toLowerCase();
    const arg = (partes[1] ?? "").toLowerCase();

    // o clássico, tratado antes de tudo
    if (/^sudo\s+rm\s+-rf\s+\/?$/.test(cru.toLowerCase())) {
      escrever([
        { tipo: "erro", texto: t("Boa tentativa. Este é o meu portfólio, não o teu.", "Nice try. This is my portfolio, not yours.") },
        { tipo: "saida", texto: t("(nada foi apagado, podes respirar)", "(nothing was deleted, you can breathe)") },
      ]);
      return;
    }

    switch (cmd) {
      case "help": {
        const alvo = t("<projeto>", "<project>");
        const linha = (uso: string, desc: string) => uso.padEnd(22) + desc;
        escrever(saida(
          linha("help", t("esta lista", "this list")),
          linha("whoami", t("quem sou eu", "who I am")),
          linha("ls", t("lista os projetos", "list the projects")),
          linha(`cat ${alvo}`, t("detalhes de um projeto", "details of a project")),
          linha(`open ${alvo}`, t("abre a página do projeto", "open the project page")),
          linha("cv", t("descarrega o currículo", "download the CV")),
          linha("theme [dark|light]", t("muda o tema", "switch theme")),
          linha("lang [pt|en]", t("muda a língua", "switch language")),
          linha("neofetch", t("informação do sistema", "system information")),
          linha("clear", t("limpa o ecrã", "clear the screen")),
          linha("exit", t("sai do terminal", "leave the terminal")),
        ));
        return;
      }

      case "whoami":
        escrever(saida(
          "Diogo Pinto",
          t("Estudante de Engenharia Informática no ISEC.", "Computer Engineering student at ISEC."),
          t("Antes disso, Técnico de Informática — Sistemas.", "Before that, IT Technician — Systems."),
          t("Java, JavaFX, React. Com um fraquinho por inteligência artificial.", "Java, JavaFX, React. With a soft spot for artificial intelligence."),
        ));
        return;

      case "ls":
        if (!visiveis.length) {
          escrever([{ tipo: "aviso", texto: t("ainda a carregar…", "still loading…") }]);
          return;
        }
        escrever(saida(
          ...visiveis.map((p) => `${p.slug.padEnd(14)} ${p.year.padEnd(6)} ${p.title}`)
        ));
        escrever([{ tipo: "aviso", texto: t(`${visiveis.length} projetos · usa 'cat <nome>' para ver um`, `${visiveis.length} projects · use 'cat <name>' to see one`) }]);
        return;

      case "cat": {
        if (!arg) { escrever([{ tipo: "erro", texto: t("falta o nome. exemplo: cat bitquest", "missing the name. example: cat bitquest") }]); return; }
        const p = encontrarProjeto(arg);
        if (!p) { escrever([{ tipo: "erro", texto: t(`não existe nenhum projeto '${arg}'. tenta 'ls'.`, `no project named '${arg}'. try 'ls'.`) }]); return; }
        escrever(saida(
          `${p.title} (${p.year})`,
          loc(p.role, lang),
          "",
          loc(p.summary, lang),
          "",
          `tags: ${p.tags.join(", ")}`,
        ));
        if (p.github) escrever(saida(`github: ${p.github}`));
        escrever([{ tipo: "aviso", texto: t(`'open ${p.slug}' abre a página`, `'open ${p.slug}' opens the page`) }]);
        return;
      }

      case "open": {
        if (!arg) { escrever([{ tipo: "erro", texto: t("falta o nome. exemplo: open deepsea", "missing the name. example: open deepsea") }]); return; }
        const p = encontrarProjeto(arg);
        if (!p) { escrever([{ tipo: "erro", texto: t(`não existe nenhum projeto '${arg}'.`, `no project named '${arg}'.`) }]); return; }
        escrever([{ tipo: "aviso", texto: t(`a abrir ${p.title}…`, `opening ${p.title}…`) }]);
        setTimeout(() => { onSair(); navigate(`/projeto/${p.slug}`); }, 420);
        return;
      }

      case "cv":
        if (!cvUrl) { escrever([{ tipo: "erro", texto: t("não há currículo carregado de momento.", "no CV uploaded at the moment.") }]); return; }
        escrever([{ tipo: "aviso", texto: t("a descarregar o currículo…", "downloading the CV…") }]);
        openSafeExternalUrl(cvUrl);
        return;

      case "theme": {
        const alvo = arg === "dark" || arg === "light" ? arg : theme === "dark" ? "light" : "dark";
        if (alvo !== theme) toggleTheme();
        escrever([{ tipo: "aviso", texto: t(`tema: ${alvo}`, `theme: ${alvo}`) }]);
        return;
      }

      case "lang": {
        const alvo = arg === "pt" || arg === "en" ? arg : lang === "pt" ? "en" : "pt";
        setLang(alvo);
        escrever([{ tipo: "aviso", texto: alvo === "pt" ? "língua: português" : "language: english" }]);
        return;
      }

      case "neofetch": {
        const info = [
          "diogo@diogodev",
          "--------------",
          `${t("cargo", "role")}: ${t("Estudante de Eng. Informática", "Computer Engineering student")}`,
          `${t("escola", "school")}: ISEC`,
          `${t("projetos", "projects")}: ${visiveis.length}`,
          `${t("tema", "theme")}: ${theme}`,
          `${t("língua", "language")}: ${lang}`,
          `stack: React · TypeScript · Supabase`,
        ];
        const alt = Math.max(LOGO.length, info.length);
        escrever(saida(
          ...Array.from({ length: alt }, (_, i) => `${(LOGO[i] ?? "        ")}   ${info[i] ?? ""}`)
        ));
        return;
      }

      case "coffee":
        escrever([{ tipo: "erro", texto: "HTTP 418 — I'm a teapot" }]);
        return;

      case "clear":
        setLinhas([]);
        return;

      case "exit":
      case "quit":
        onSair();
        return;

      default:
        escrever([{ tipo: "erro", texto: t(`${cmd}: comando não encontrado. escreve 'help'.`, `${cmd}: command not found. type 'help'.`) }]);
    }
  };

  // Tab completa nomes de comandos e de projetos
  const completar = () => {
    const partes = valor.split(/\s+/);
    const ultima = partes[partes.length - 1].toLowerCase();
    if (!ultima) return;
    const universo = partes.length > 1
      ? visiveis.map((p) => p.slug)
      : ["help", "whoami", "ls", "cat", "open", "cv", "theme", "lang", "neofetch", "clear", "exit"];
    const hipoteses = universo.filter((c) => c.startsWith(ultima));
    if (hipoteses.length === 1) {
      partes[partes.length - 1] = hipoteses[0];
      setValor(partes.join(" ") + " ");
    } else if (hipoteses.length > 1) {
      escrever([{ tipo: "entrada", texto: valor }, ...saida(hipoteses.join("   "))]);
    }
  };

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); correr(valor); setValor(""); }
    else if (e.key === "Escape") { e.preventDefault(); onSair(); }
    else if (e.key === "Tab") { e.preventDefault(); completar(); }
    else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!historico.length) return;
      const i = Math.min(posHistorico + 1, historico.length - 1);
      setPosHistorico(i); setValor(historico[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const i = posHistorico - 1;
      if (i < 0) { setPosHistorico(-1); setValor(""); }
      else { setPosHistorico(i); setValor(historico[i]); }
    } else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); setLinhas([]); }
  };

  const cor = (tipo: Linha["tipo"]) =>
    tipo === "entrada" ? "var(--fg)" : tipo === "erro" ? "#E5484D" : tipo === "aviso" ? "var(--accent)" : "var(--fg-2)";

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: "flex", flexDirection: "column", cursor: "text",
        // altura acompanha o ecrã, entre limites
        height: "min(72vh, 680px)", minHeight: 280,
      }}
    >
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 20px", fontSize: 13, lineHeight: 1.7 }}>
        {linhas.map((l, i) => (
          <div
            key={i}
            className="mono"
            style={{ color: cor(l.tipo), whiteSpace: "pre-wrap", wordBreak: "break-word", animation: "fadeIn 140ms var(--ease-out)" }}
          >
            {l.tipo === "entrada" ? <><span style={{ color: "var(--accent)" }}>{PROMPT}</span> {l.texto}</> : l.texto}
          </div>
        ))}
        <div ref={fimRef} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 18px", borderTop: "1px solid var(--line)" }}>
        <span className="mono" style={{ fontSize: 12.5, color: "var(--accent)", flexShrink: 0 }}>{PROMPT}</span>
        <input
          ref={inputRef}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          onKeyDown={aoTeclar}
          spellCheck={false}
          autoComplete="off"
          aria-label={t("linha de comandos", "command line")}
          style={{ flex: 1, background: "none", border: 0, outline: "none", color: "var(--fg)", fontFamily: "var(--font-mono)", fontSize: 12.5 }}
        />
      </div>
    </div>
  );
}
