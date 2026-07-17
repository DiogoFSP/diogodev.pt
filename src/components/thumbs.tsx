import type { FC } from "react";

// Miniaturas dos projetos — SVGs estilizados desenhados em código
// (sem imagens de stock), vindos do design (thumbs.jsx).

function Thumb4inline() {
  // Tabuleiro de Connect-Four em movimento
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
    <svg viewBox="0 0 180 160" style={{ width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="g4i" cx="0.7" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFB454" stopOpacity="0.18" />
          <stop offset="1" stopColor="#FFB454" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="180" height="160" fill="url(#g4i)" />
      <g>{cells}</g>
      {/* peça a cair */}
      <circle cx="130" cy="-4" r="8" fill="#FFB454">
        <animate attributeName="cy" values="-4;42;42;42" keyTimes="0;0.4;0.6;1" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function ThumbDeepSea() {
  // Vista top-down do fosso marinho, como o jogo real: grelha de tiles,
  // paredes de rocha, polvo, correntes, drone e minério.
  const tile = 20;
  const rocks = [
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
    <svg viewBox="0 0 180 160" style={{ width: "100%", height: "100%" }}>
      {/* água do fosso */}
      <rect width="180" height="160" fill="#3E5F7E" />
      <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">{gridLines}</g>

      {/* paredes de rocha nas margens */}
      {rocks.map(([c, r]) => (
        <rect key={`${c}-${r}`} x={c * tile} y={r * tile} width={tile} height={tile}
          fill="#232E28" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}

      {/* corrente (ondas) */}
      <g stroke="#E8F1F8" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.85">
        <path d="M64 106 q3 -3 6 0 t6 0" />
        <path d="M64 111 q3 -3 6 0 t6 0" />
        <path d="M64 116 q3 -3 6 0 t6 0" />
      </g>

      {/* polvo */}
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

      {/* drone (vindo dos screenshots: corpo cinzento, cúpula azul) */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0,0; 0,-3; 0,0" dur="3.4s" repeatCount="indefinite" />
        <rect x="106" y="26" width="26" height="15" rx="5" fill="#D7DDE3" stroke="#5EBFFF" strokeWidth="0.8" />
        <circle cx="119" cy="33" r="4.5" fill="#5EBFFF" opacity="0.9" />
        <rect x="102" y="30" width="5" height="8" rx="2" fill="#3A4A5A" />
        <rect x="131" y="30" width="5" height="8" rx="2" fill="#3A4A5A" />
        {/* luzes */}
        <circle cx="110" cy="29" r="1.2" fill="#FFE08A">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* minério dourado */}
      <g transform="translate(112,116)">
        <path d="M6 0 L14 2 L18 9 L14 16 L5 17 L0 10 L2 3 Z" fill="#C9A23F" stroke="#8A6D25" strokeWidth="0.8" />
        <path d="M6 4 L9 6 L7 9 Z" fill="#FFE08A" />
        <path d="M11 10 L14 11 L12 14 Z" fill="#FFE08A" />
        <circle cx="16" cy="3" r="1.2" fill="#FFF3C4">
          <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* HUD do jogo: barras de combustível e integridade */}
      <g transform="translate(122,146)">
        <rect x="0" y="0" width="50" height="4" rx="2" fill="#2B2B33" />
        <rect x="0" y="0" width="34" height="4" rx="2" fill="#F0A63C" />
        <rect x="0" y="7" width="50" height="4" rx="2" fill="#2B2B33" />
        <rect x="0" y="7" width="46" height="4" rx="2" fill="#57C785" />
      </g>
    </svg>
  );
}

export const THUMBS: Record<string, FC> = {
  "4inline": Thumb4inline,
  deepsea: ThumbDeepSea,
};
