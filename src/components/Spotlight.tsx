import { useEffect } from "react";

const RAIO = 320;
const ESPERA_TOQUE = 700;

// brilho que segue o cursor; rAF limita o redesenho
export default function Spotlight() {
  useEffect(() => {
    const el = document.getElementById("spotlight-glow");
    if (!el) return;
    const semRato = window.matchMedia("(hover: none)").matches;
    let raf = 0;
    let apagar = 0;

    const pintar = (x: number, y: number) => {
      el.style.background = `radial-gradient(${RAIO}px circle at ${x}px ${y}px, var(--accent-soft), transparent 70%)`;
    };

    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      const x = e.clientX;
      const y = e.clientY;
      raf = requestAnimationFrame(() => pintar(x, y));
    };

    const onToque = (e: PointerEvent) => {
      pintar(e.clientX, e.clientY);
      el.style.opacity = "1";
      clearTimeout(apagar);
      apagar = window.setTimeout(() => { el.style.opacity = "0"; }, ESPERA_TOQUE);
    };

    if (semRato) {
      el.style.opacity = "0";
      window.addEventListener("pointerdown", onToque);
    } else {
      window.addEventListener("mousemove", onMove);
    }

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("pointerdown", onToque);
      cancelAnimationFrame(raf);
      clearTimeout(apagar);
    };
  }, []);
  return (
    <div
      id="spotlight-glow"
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, transition: "opacity 450ms var(--ease-out)" }}
    />
  );
}
