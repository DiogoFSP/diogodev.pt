import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Icon from "../components/Icon";
import { useLang } from "../lang";
import { useTitulo } from "../seo";

export default function NotFound() {
  const { t } = useLang();
  useTitulo(t("Página não encontrada", "Page not found"));

  return (
    <main style={{ minHeight: "calc(100vh - 60px)", display: "flex", flexDirection: "column", justifyContent: "space-between", animation: "fadeIn 380ms var(--ease-out)" }}>
      <div className="container" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0", textAlign: "center" }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--accent)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 16 }}>
          404 · {t("não encontrada", "not found")}
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 300, letterSpacing: "-0.03em", margin: 0, lineHeight: 1.08, textWrap: "balance" }}>
          {t("Esta página não existe.", "This page doesn't exist.")}
        </h1>
        <p style={{ fontSize: 15, color: "var(--fg-2)", marginTop: 20, maxWidth: 460, lineHeight: 1.6 }}>
          {t(
            "O endereço que introduziu pode estar incorreto ou ter sido movido.",
            "The link you followed may be broken or the page may have been moved."
          )}
        </p>
        <Link
          to="/"
          className="btn btn-primary"
          style={{ marginTop: 32, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Icon name="arrowRight" size={14} /> {t("voltar ao início", "back to home")}
        </Link>
      </div>
      <Footer />
    </main>
  );
}
