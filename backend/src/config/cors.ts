export function isAllowedOrigin(
  origin: string | undefined,
  allowedOrigins: ReadonlySet<string>,
) {
  if (!origin || allowedOrigins.has(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".manus.computer");
  } catch {
    return false;
  }
}
