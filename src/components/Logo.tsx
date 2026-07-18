// "D" em currentColor, ponto em var(--accent)
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <rect x="1" y="1" width="30" height="30" rx="7" stroke="currentColor" strokeOpacity="0.4" />
        <path d="M9 21V11h4.2c2.9 0 5 2.2 5 5s-2.1 5-5 5H9z" fill="currentColor" />
        <circle cx="22" cy="11" r="1.5" fill="var(--accent)" />
      </svg>
      <span>
        diogodev<span style={{ color: "var(--fg-3)" }}>.pt</span>
      </span>
    </span>
  );
}
