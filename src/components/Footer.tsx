import { Link } from "react-router-dom";
import { useLang } from "../lang";

export default function Footer() {
  const { t } = useLang();
  const linkStyle = { color: "inherit", textDecoration: "none" } as const;
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "32px 0", marginTop: 80 }}>
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "var(--fg-3)",
          fontSize: 12,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div className="mono">© 2026 · diogodev.pt</div>
        <div className="mono" style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          <Link to="/" style={linkStyle}>{t("início", "home")}</Link>
          <Link to="/contacto" style={linkStyle}>{t("contacto", "contact")}</Link>
          <a href="https://github.com/DiogoFSP" target="_blank" rel="noopener" style={linkStyle}>github</a>
          <a href="https://www.linkedin.com/in/diogofspinto17/" target="_blank" rel="noopener" style={linkStyle}>linkedin</a>
          <Link to="/admin" style={{ ...linkStyle, color: "var(--fg-4)" }}>admin</Link>
        </div>
      </div>
    </footer>
  );
}
