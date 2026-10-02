// Real Google SERP data via Serper.dev.
// Free signup (no card) at https://serper.dev includes 2,500 searches.
// Key goes in .env as SERPER_API_KEY. Without a key every caller
// falls back to AI-guessed research, so nothing ever breaks.

interface SerperOrganic {
  title?: string;
  link?: string;
  snippet?: string;
  position?: number;
}

interface SerperResponse {
  organic?: SerperOrganic[];
  peopleAlsoAsk?: Array<{ question?: string }>;
  relatedSearches?: Array<{ query?: string }>;
}

export interface SerpResult {
  rank: number;
  title: string;
  url: string;
  snippet: string;
}

export interface SerpData {
  topResults: SerpResult[];
  peopleAlsoAsk: string[];
  relatedSearches: string[];
}

export function hasSerperKey(): boolean {
  return !!process.env.SERPER_API_KEY;
}

// Returns null when no key is set (caller uses AI fallback).
// Throws with a plain-English message when the key/credits fail.
export async function fetchSerp(keyword: string): Promise<SerpData | null> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return null;

  const q = keyword.trim();
  if (!q) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        q: q.slice(0, 200),
        num: 10,
        gl: process.env.SERPER_GL || "in",
        hl: process.env.SERPER_HL || "en",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error("Serper key is invalid. Check SERPER_API_KEY in .env.");
      }
      if (res.status === 402 || res.status === 429) {
        throw new Error("Serper has no credits left. Top up at serper.dev.");
      }
      throw new Error(`Serper search failed (HTTP ${res.status}).`);
    }

    const data = (await res.json()) as SerperResponse;
    const organic = Array.isArray(data.organic) ? data.organic : [];

    return {
      topResults: organic
        .slice(0, 10)
        .map((r, i) => ({
          rank: r.position || i + 1,
          title: r.title || "Untitled",
          url: r.link || "",
          snippet: (r.snippet || "").slice(0, 500),
        }))
        .filter((r) => r.url.length > 0),
      peopleAlsoAsk: (data.peopleAlsoAsk || [])
        .map((x) => x.question || "")
        .filter(Boolean)
        .slice(0, 8),
      relatedSearches: (data.relatedSearches || [])
        .map((x) => x.query || "")
        .filter(Boolean)
        .slice(0, 8),
    };
  } finally {
    clearTimeout(timer);
  }
}