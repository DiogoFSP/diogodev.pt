import type { FC, ReactElement } from "react";


// a caixa da miniatura num cartao largo mede cerca de 777x123 (racio 6,3)
// em ecra grande e 550x123 (4,5) em ecra medio, por isso a versao larga e
// uma faixa fina: 320x58 fica no meio dos dois e quase nao corta.
const FAIXA_W = 320;
const FAIXA_H = 58;

function Thumb4inlineLargo() {
  const cells = [];
  const preenchidas: Record<string, "y" | "r"> = {
    "1-1": "y", "2-1": "r", "3-1": "y", "3-0": "r",
    "4-1": "y", "4-0": "y", "5-1": "r", "6-1": "y",
  };
  const dx = (FAIXA_W - 7 * 22) / 2;
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 7; c++) {
      const f = preenchidas[`${c}-${r}`];
      cells.push(
        <circle key={`${c}-${r}`} cx={dx + 11 + c * 22} cy={24 + r * 20} r="8"
          fill={f === "y" ? "#FFB454" : f === "r" ? "#FF6B6B" : "transparent"}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      );
    }
  }
  return (
    <svg viewBox={`0 0 ${FAIXA_W} ${FAIXA_H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="g4iL" cx="0.7" cy="0.4" r="0.9">
          <stop offset="0" stopColor="#FFB454" stopOpacity="0.18" />
          <stop offset="1" stopColor="#FFB454" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={FAIXA_W} height={FAIXA_H} fill="url(#g4iL)" />
      <g>{cells}</g>
      <circle cx={dx + 11 + 5 * 22} cy="-8" r="8" fill="#FFB454">
        <animate attributeName="cy" values="-8;-8;24;24" keyTimes="0;0.35;0.75;1" dur="3.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function Thumb4inline({ largo }: { largo?: boolean }) {
  if (largo) return <Thumb4inlineLargo />;
  const filled: Record<string, "y" | "r"> = {
    "1-5": "y", "2-5": "r", "3-5": "y", "3-4": "r",
    "4-5": "y", "4-4": "y", "4-3": "r", "5-5": "r",
  };
  const cells = [];
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const k = `${c}-${r}`;
      const f = filled[k];
      cells.push(
        <circle key={k} cx={20 + c * 22} cy={20 + r * 22} r="8"
          fill={f === "y" ? "#FFB454" : f === "r" ? "#FF6B6B" : "transparent"}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      );
    }
  }
  return (
    <svg viewBox="0 0 180 160" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="g4iN" cx="0.7" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFB454" stopOpacity="0.18" />
          <stop offset="1" stopColor="#FFB454" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="180" height="160" fill="url(#g4iN)" />
      <g>{cells}</g>
      <circle cx="130" cy="-4" r="8" fill="#FFB454">
        <animate attributeName="cy" values="-4;42;42;42" keyTimes="0;0.4;0.6;1" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function ThumbDeepSeaLargo() {
  const tile = 20;
  const cols = FAIXA_W / tile;
  const rochas: [number, number][] = [
    [0, 0], [0, 2], [1, 1],
    [cols - 1, 0], [cols - 1, 1], [cols - 2, 2],
    [6, 0], [9, 2], [12, 0],
  ];
  const linhas = [];
  for (let i = 1; i < cols; i++) linhas.push(<line key={`v${i}`} x1={i * tile} y1="0" x2={i * tile} y2={FAIXA_H} />);
  for (let i = 1; i < 3; i++) linhas.push(<line key={`h${i}`} x1="0" y1={i * tile} x2={FAIXA_W} y2={i * tile} />);
  return (
    <svg viewBox={`0 0 ${FAIXA_W} ${FAIXA_H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
      <rect width={FAIXA_W} height={FAIXA_H} fill="#3E5F7E" />
      <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">{linhas}</g>
      {rochas.map(([c, r]) => (
        <rect key={`${c}-${r}`} x={c * tile} y={r * tile} width={tile} height={tile}
          fill="#232E28" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}

      <g transform="translate(58,4)">
        <animateTransform attributeName="transform" type="translate" values="58,4; 58,7; 58,4" dur="2.8s" repeatCount="indefinite" />
        <circle cx="0" cy="18" r="8" fill="#F2789B" />
        <circle cx="-3" cy="16" r="1.4" fill="#2B2B33" />
        <circle cx="3" cy="16" r="1.4" fill="#2B2B33" />
        <g stroke="#F2789B" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M-6 24 q-3 5 1 8" /><path d="M-1 26 q-1 5 2 8" /><path d="M3 26 q2 5 -1 8" /><path d="M7 24 q4 4 1 8" />
        </g>
      </g>

      <g stroke="#E8F1F8" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M126 20 q3 -3 6 0 t6 0" /><path d="M126 26 q3 -3 6 0 t6 0" /><path d="M126 32 q3 -3 6 0 t6 0" />
      </g>

      <g transform="translate(84,0)">
        <animateTransform attributeName="transform" type="translate" values="84,0; 84,-3; 84,0" dur="3.4s" repeatCount="indefinite" />
        <rect x="106" y="20" width="26" height="15" rx="5" fill="#D7DDE3" stroke="#5EBFFF" strokeWidth="0.8" />
        <circle cx="119" cy="27" r="4.5" fill="#5EBFFF" opacity="0.9" />
        <rect x="102" y="24" width="5" height="8" rx="2" fill="#3A4A5A" />
        <rect x="131" y="24" width="5" height="8" rx="2" fill="#3A4A5A" />
      </g>

      <g transform="translate(244,20)">
        <path d="M6 0 L14 2 L18 9 L14 16 L5 17 L0 10 L2 3 Z" fill="#C9A23F" stroke="#8A6D25" strokeWidth="0.8" />
        <path d="M6 4 L9 6 L7 9 Z" fill="#FFE08A" />
        <circle cx="16" cy="3" r="1.2" fill="#FFF3C4">
          <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>

      <g transform="translate(276,22)">
        <rect x="0" y="0" width="36" height="4" rx="2" fill="#2B2B33" />
        <rect x="0" y="0" width="24" height="4" rx="2" fill="#F0A63C" />
        <rect x="0" y="7" width="36" height="4" rx="2" fill="#2B2B33" />
        <rect x="0" y="7" width="33" height="4" rx="2" fill="#57C785" />
      </g>
    </svg>
  );
}

function ThumbDeepSea({ largo }: { largo?: boolean }) {
  if (largo) return <ThumbDeepSeaLargo />;
  const tile = 20;
  const rocks: [number, number][] = [
    [0, 0], [0, 1], [0, 3], [0, 4], [0, 6], [0, 7],
    [1, 0], [1, 2], [1, 5], [1, 7],
    [7, 0], [7, 3], [7, 6],
    [8, 0], [8, 1], [8, 2], [8, 4], [8, 5], [8, 7],
  ];
  const gridLines = [];
  for (let i = 1; i < 9; i++) {
    gridLines.push(<line key={`v${i}`} x1={i * tile} y1="0" x2={i * tile} y2="160" />);
  }
  for (let i = 1; i < 8; i++) {
    gridLines.push(<line key={`h${i}`} x1="0" y1={i * tile} x2="180" y2={i * tile} />);
  }
  return (
    <svg viewBox="0 0 180 160" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
      <rect width="180" height="160" fill="#3E5F7E" />
      <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">{gridLines}</g>

      {rocks.map(([c, r]) => (
        <rect key={`${c}-${r}`} x={c * tile} y={r * tile} width={tile} height={tile}
          fill="#232E28" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}

      <g stroke="#E8F1F8" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M64 106 q3 -3 6 0 t6 0" />
        <path d="M64 111 q3 -3 6 0 t6 0" />
        <path d="M64 116 q3 -3 6 0 t6 0" />
      </g>

      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,3; 0,0" dur="2.8s" repeatCount="indefinite" />
        <circle cx="50" cy="52" r="8" fill="#F2789B" />
        <circle cx="47" cy="50" r="1.4" fill="#2B2B33" />
        <circle cx="53" cy="50" r="1.4" fill="#2B2B33" />
        <g stroke="#F2789B" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M44 58 q-3 5 1 8" />
          <path d="M49 60 q-1 5 2 8" />
          <path d="M53 60 q2 5 -1 8" />
          <path d="M57 58 q4 4 1 8" />
        </g>
      </g>

      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="3.4s" repeatCount="indefinite" />
        <rect x="106" y="26" width="26" height="15" rx="5" fill="#D7DDE3" stroke="#5EBFFF" strokeWidth="0.8" />
        <circle cx="119" cy="33" r="4.5" fill="#5EBFFF" opacity="0.9" />
        <rect x="102" y="30" width="5" height="8" rx="2" fill="#3A4A5A" />
        <rect x="131" y="30" width="5" height="8" rx="2" fill="#3A4A5A" />
        <circle cx="110" cy="29" r="1.2" fill="#FFE08A">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </g>

      <g transform="translate(112,116)">
        <path d="M6 0 L14 2 L18 9 L14 16 L5 17 L0 10 L2 3 Z" fill="#C9A23F" stroke="#8A6D25" strokeWidth="0.8" />
        <path d="M6 4 L9 6 L7 9 Z" fill="#FFE08A" />
        <path d="M11 10 L14 11 L12 14 Z" fill="#FFE08A" />
        <circle cx="16" cy="3" r="1.2" fill="#FFF3C4">
          <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>

      <g transform="translate(122,146)">
        <rect x="0" y="0" width="50" height="4" rx="2" fill="#2B2B33" />
        <rect x="0" y="0" width="34" height="4" rx="2" fill="#F0A63C" />
        <rect x="0" y="7" width="50" height="4" rx="2" fill="#2B2B33" />
        <rect x="0" y="7" width="46" height="4" rx="2" fill="#57C785" />
      </g>
    </svg>
  );
}

function ThumbPortfolioLargo() {
  const cores = ["#5EBFFF", "#FFB454", "#C084FC", "#6EE7A8"];
  return (
    <svg viewBox={`0 0 ${FAIXA_W} ${FAIXA_H}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="gpfL" cx="0.25" cy="0.3" r="1">
          <stop offset="0" stopColor="#6EE7A8" stopOpacity="0.14" />
          <stop offset="1" stopColor="#6EE7A8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={FAIXA_W} height={FAIXA_H} fill="#0F0F11" />
      <rect width={FAIXA_W} height={FAIXA_H} fill="url(#gpfL)" />

      <rect x="10" y="6" width={FAIXA_W - 20} height={FAIXA_H - 12} rx="6" fill="#141417" stroke="#2A2A31" />

      {/* a etiqueta do cartao ocupa o canto superior esquerdo, por isso o
          conteudo comeca abaixo dela */}
      <text x="22" y="42" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#F5F5F7">Olá, sou o Diogo</text>
      <rect x="118" y="33" width="4" height="10" fill="#FFB454">
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite" />
      </rect>

      {cores.map((cor, i) => {
        const x = 158 + i * 40;
        return (
          <g key={i}>
            <rect x={x} y="12" width="32" height="34" rx="4" fill="#0F0F11" stroke="#2A2A31" />
            <rect x={x + 5} y="18" width="16" height="3" rx="1.5" fill={cor} />
            <rect x={x + 5} y="26" width="22" height="3" rx="1.5" fill="#2A2A31" />
            <rect x={x + 5} y="33" width="18" height="3" rx="1.5" fill="#2A2A31" />
          </g>
        );
      })}
    </svg>
  );
}

function ThumbPortfolio({ largo }: { largo?: boolean }) {
  if (largo) return <ThumbPortfolioLargo />;
  return (
    <svg viewBox="0 0 180 160" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="gpfN" cx="0.3" cy="0.2" r="0.9">
          <stop offset="0" stopColor="#6EE7A8" stopOpacity="0.14" />
          <stop offset="1" stopColor="#6EE7A8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="180" height="160" fill="#0F0F11" />
      <rect width="180" height="160" fill="url(#gpfN)" />

      <rect x="18" y="18" width="144" height="124" rx="8" fill="#141417" stroke="#2A2A31" />
      <circle cx="32" cy="30" r="2.5" fill="#3A3A40" />
      <circle cx="41" cy="30" r="2.5" fill="#3A3A40" />
      <circle cx="50" cy="30" r="2.5" fill="#3A3A40" />
      <rect x="62" y="24" width="88" height="12" rx="6" fill="#0F0F11" stroke="#1F1F24" />
      <text x="70" y="33" fontFamily="JetBrains Mono, monospace" fontSize="7" fill="#6EE7A8">diogodev.pt</text>

      <text x="32" y="66" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#F5F5F7">Olá, sou o Diogo</text>
      <rect x="140" y="57" width="5" height="11" fill="#FFB454">
        <animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite" />
      </rect>
      <rect x="32" y="76" width="96" height="4" rx="2" fill="#2A2A31" />
      <rect x="32" y="84" width="72" height="4" rx="2" fill="#2A2A31" />

      <rect x="32" y="98" width="52" height="32" rx="4" fill="#0F0F11" stroke="#2A2A31" />
      <rect x="38" y="104" width="24" height="3" rx="1.5" fill="#5EBFFF" />
      <rect x="38" y="112" width="34" height="3" rx="1.5" fill="#2A2A31" />
      <rect x="38" y="118" width="28" height="3" rx="1.5" fill="#2A2A31" />
      <rect x="92" y="98" width="52" height="32" rx="4" fill="#0F0F11" stroke="#2A2A31" />
      <rect x="98" y="104" width="24" height="3" rx="1.5" fill="#FFB454" />
      <rect x="98" y="112" width="34" height="3" rx="1.5" fill="#2A2A31" />
      <rect x="98" y="118" width="28" height="3" rx="1.5" fill="#2A2A31" />
    </svg>
  );
}

const RUIDO_COPA = [0, -4, 4, 0, -4, 8, 0, 4];

function ThumbBitQuest({ largo }: { largo?: boolean }) {
  const CEU_ALTO = "#F4F9FD", CEU_BAIXO = "#DCE6EF";
  const LONGE = "#B3C0CC", MEIO = "#83909B", ARVORES = "#424F5A", ESCURO = "#0E0E0E";
  const PEDRA = "#615F6C", PEDRA_ESC = "#454448";
  const OURO = "#F0C051", OURO_CLARO = "#F7E588", LARANJA = "#EE883A";
  const W = largo ? FAIXA_W : 180, H = largo ? FAIXA_H : 160, P = 4, COLS = W / P;

  let n = 0;
  const b = (x: number, y: number, w: number, h: number, f: string) => (
    <rect key={n++} x={x} y={y} width={w} height={h} fill={f} />
  );
  const q = (v: number) => Math.round(v / P) * P;

  const camada = (base: number, amp: number, freq: number, fase: number, cor: string) => {
    const out: ReactElement[] = [];
    for (let i = 0; i < COLS; i++) {
      const y = q(base - amp * Math.sin((i / COLS) * Math.PI * freq + fase));
      out.push(b(i * P, y, P, H - y, cor));
    }
    return out;
  };

  const torre = (x: number, topo: number, larg: number, base: number) => [
    b(x, topo + 12, larg, base - topo - 12, LONGE),
    b(x + larg / 4, topo, larg / 2, 12, LONGE),
    b(x + larg / 2 - 2, topo - 8, 4, 8, LONGE),
  ];

  const pinheiro = (x: number, base: number, h: number) => {
    const out: ReactElement[] = [];
    for (let i = 0; i < h / P; i++) {
      const larg = P * (1 + 2 * Math.floor(i / 3));
      out.push(b(x - larg / 2, base - h + i * P, larg, P, ARVORES));
    }
    out.push(b(x - 2, base, 4, 6, ARVORES));
    return out;
  };

  const copa = () => {
    const out: ReactElement[] = [];
    const alturaMax = largo ? 10 : 22;
    for (let i = 0; i < COLS; i++) {
      const arco = q(4 + alturaMax * Math.pow((2 * i) / (COLS - 1) - 1, 2));
      const ruido = largo ? RUIDO_COPA[Math.floor(i / 2) % RUIDO_COPA.length] / 2 : RUIDO_COPA[Math.floor(i / 2) % RUIDO_COPA.length];
      out.push(b(i * P, 0, P, Math.max(4, arco + ruido), ESCURO));
    }
    return out;
  };

  const GLIFOS: Record<string, string[]> = {
    B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  };
  const letra = (car: string, x: number, y: number, s = 4) => {
    const g = GLIFOS[car];
    const contorno: ReactElement[] = [];
    const cheio: ReactElement[] = [];
    g.forEach((linha, ly) =>
      [...linha].forEach((c, lx) => {
        if (c !== "1") return;
        contorno.push(b(x + lx * s - 1, y + ly * s - 1, s + 2, s + 2, ESCURO));
        cheio.push(b(x + lx * s, y + ly * s, s, s, ly < 2 ? OURO_CLARO : OURO));
      })
    );
    return [...contorno, ...cheio];
  };

  const yFar = largo ? 34 : 88, yMid = largo ? 42 : 106, yChao = largo ? 48 : 118;
  const yBarra = largo ? 44 : 124, yPinhos = largo ? 50 : 120;

  const barra = () => {
    if (largo) return [];
    const y = yBarra, x = 16, larg = W - 2 * x, alt = 22;
    const out: ReactElement[] = [b(x - 2, y - 2, larg + 4, alt + 4, PEDRA_ESC), b(x, y, larg, alt, PEDRA)];
    for (let i = 0; i < larg / 8; i++) {
      out.push(b(x + i * 8 + (i % 2) * 4, y + (i % 3) * 7, 1, 7, PEDRA_ESC));
    }
    const passo = largo ? 46 : 36;
    const cx = [0, 1, 2, 3].map((i) => W / 2 + (i - 1.5) * passo);
    out.push(b(cx[0] - 6, y + 10, 12, 8, "#C8CDD4"), b(cx[0] - 8, y + 6, 16, 4, LARANJA), b(cx[0] - 2, y + 13, 4, 5, PEDRA_ESC));
    out.push(b(cx[1] - 6, y + 7, 12, 11, "#4A78C8"), b(cx[1] - 4, y + 11, 8, 5, "#E8B24A"), b(cx[1] - 3, y + 4, 6, 3, "#3A5FA0"));
    out.push(b(cx[2] - 6, y + 8, 12, 10, "#C9A05A"), b(cx[2] - 3, y + 5, 6, 3, "#8A6A3A"), b(cx[2] - 2, y + 11, 4, 4, OURO_CLARO));
    out.push(b(cx[3] - 3, y + 5, 6, 6, ESCURO), b(cx[3] - 6, y + 12, 12, 6, ESCURO));
    return out;
  };

  const escala = 4;
  const lx = Math.round((W - 12 * escala) / 2);
  const ly = largo ? 8 : 40;
  const pinhos: [number, number][] = largo
    ? [[14, 16], [40, 12], [66, 18], [92, 12], [118, 16], [200, 14], [226, 18], [252, 12], [278, 16], [304, 14]]
    : [[14, 36], [38, 28], [60, 32], [86, 24], [110, 36], [136, 28], [164, 32]];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "100%" }}
      preserveAspectRatio="xMidYMid slice"
      shapeRendering="crispEdges"
    >
      <defs>
        <linearGradient id={`bqceu${largo ? "L" : "N"}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={CEU_ALTO} />
          <stop offset="1" stopColor={CEU_BAIXO} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#bqceu${largo ? "L" : "N"})`} />
      {torre(Math.round(W * 0.16), yFar - (largo ? 22 : 50), 12, yFar + 8)}
      {torre(Math.round(W * 0.84), yFar - (largo ? 18 : 40), 8, yFar + 8)}
      {camada(yFar, largo ? 6 : 12, 2.2, 0.4, LONGE)}
      {letra("B", lx, ly, escala)}
      {letra("Q", lx + 7 * escala, ly, escala)}
      {camada(yMid, largo ? 5 : 9, 3.1, 1.9, MEIO)}
      {pinhos.map(([x, h]) => pinheiro(x, yPinhos, h))}
      {camada(yPinhos, largo ? 2 : 4, 4.7, 0.8, ARVORES)}
      <rect x="0" y={yChao} width={W} height={H - yChao} fill={ESCURO} />
      {copa()}
      {barra()}
    </svg>
  );
}

export const THUMBS: Record<string, FC<{ largo?: boolean }>> = {
  "4inline": Thumb4inline,
  deepsea: ThumbDeepSea,
  portfolio: ThumbPortfolio,
  bitquest: ThumbBitQuest,
};

export function ProjectThumb({ id, image, alt, largo }: { id: string; image?: string | null; alt?: string; largo?: boolean }) {
  if (image) {
    return <img src={image} alt={alt || ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
  }
  const Svg = THUMBS[id];
  if (Svg) return <Svg largo={largo} />;
  return <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--bg-2), var(--bg-3))" }} />;
}
