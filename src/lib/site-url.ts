/**
 * Centralized Production Site URL & Canonical Origin Configuration.
 *
 * Guarantees:
 * 1. Single source of truth for metadataBase, canonicals, sitemap, robots, and OG tags.
 * 2. Absolute rejection of placeholder domains like "https://temp".
 * 3. Fallback resolution for Vercel system environment variables.
 * 4. Fails loudly in production if configuration is missing or invalid.
 */

function sanitizeUrl(raw: string): string {
  let val = raw.trim();
  // Strip trailing slashes
  val = val.replace(/\/+$/, "");
  // Add https:// protocol if omitted
  if (!/^https?:\/\//i.test(val)) {
    val = `https://${val}`;
  }
  return val;
}

function validateUrl(candidate: string, sourceName: string): string {
  const sanitized = sanitizeUrl(candidate);

  // Reject placeholder hostnames
  if (/temp/i.test(sanitized)) {
    throw new Error(
      `[site-url] Config check failed: "${candidate}" from ${sourceName} contains forbidden placeholder "temp". ` +
        `Set SITE_URL to a valid production origin (e.g. https://se-ocontentwriter-bxts.vercel.app).`
    );
  }

  try {
    const urlObj = new URL(sanitized);
    // Reject invalid or empty hostnames
    if (!urlObj.hostname || urlObj.hostname === "temp") {
      throw new Error(`[site-url] Invalid hostname in "${candidate}" from ${sourceName}.`);
    }
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("[site-url]")) {
      throw err;
    }
    throw new Error(`[site-url] Failed to parse URL "${candidate}" from ${sourceName}: ${(err as Error).message}`);
  }
}

export function getSiteUrl(): string {
  const envCandidates: Array<{ name: string; value?: string }> = [
    { name: "SITE_URL", value: process.env.SITE_URL },
    { name: "NEXT_PUBLIC_SITE_URL", value: process.env.NEXT_PUBLIC_SITE_URL },
    { name: "NEXT_PUBLIC_APP_URL", value: process.env.NEXT_PUBLIC_APP_URL },
    {
      name: "VERCEL_PROJECT_PRODUCTION_URL",
      value: process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined,
    },
    {
      name: "VERCEL_URL",
      value: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    },
  ];

  for (const candidate of envCandidates) {
    if (candidate.value && candidate.value.trim().length > 0) {
      return validateUrl(candidate.value, candidate.name);
    }
  }

  // If in production environment and no valid URL is found:
  if (process.env.NODE_ENV === "production") {
    // If running in Vercel or CI without explicit config:
    if (process.env.VERCEL || process.env.CI) {
      throw new Error(
        `[site-url] Missing production URL configuration. ` +
          `Please set the SITE_URL or NEXT_PUBLIC_APP_URL environment variable to your production domain ` +
          `(e.g. https://se-ocontentwriter-bxts.vercel.app). Deploying with placeholder URLs is forbidden.`
      );
    }
  }

  // Development fallback
  return "http://localhost:3000";
}

export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl());
}

export function absoluteUrl(path: string = "/"): string {
  const base = getSiteUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (cleanPath === "/") {
    return base;
  }
  return `${base}${cleanPath}`;
}
