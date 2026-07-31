type UrlPolicy = {
  allowMailto?: boolean;
  allowTel?: boolean;
};

function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

export function isSafeInternalPath(path: string): boolean {
  const value = path.trim();
  return value.startsWith("/") && !value.startsWith("//") && !hasControlChars(value);
}

export function sanitizeExternalUrl(raw: string, policy: UrlPolicy = {}): string | null {
  const value = raw.trim();
  if (!value || hasControlChars(value)) return null;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  const protocol = parsed.protocol.toLowerCase();
  const allowMailto = !!policy.allowMailto;
  const allowTel = !!policy.allowTel;
  const allowed =
    protocol === "https:" ||
    protocol === "http:" ||
    (allowMailto && protocol === "mailto:") ||
    (allowTel && protocol === "tel:");

  if (!allowed) return null;
  if ((protocol === "https:" || protocol === "http:") && !parsed.hostname) return null;
  return parsed.toString();
}

export function openSafeExternalUrl(raw: string, policy: UrlPolicy = {}): boolean {
  const safe = sanitizeExternalUrl(raw, policy);
  if (!safe) return false;
  window.open(safe, "_blank", "noopener,noreferrer");
  return true;
}
