import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/session";
import { fetchSerp, hasSerperKey } from "@/lib/serp";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";


// GET /api/serp?q=your-keyword
// Returns the real Google top 10 for a keyword (titles, links, PAA, related).
// Used to verify the Serper key in seconds without running a full generation.
export async function GET(request: Request) {
  try {
    const session = await getOptionalSession();
    // Serper credits: 10 lookups/min for logged-in users, 5 lookups/min for guests
    const rateKey = session?.userId ? `serp:user:${session.userId}` : `serp:guest:${clientIp(request)}`;
    const limit = session?.userId ? 10 : 5;
    const gate = checkRateLimit(rateKey, limit, 60_000);
    if (!gate.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many research lookups. Wait ${gate.retryAfterSec}s.` },
        { status: 429 }
      );
    }


    const q = new URL(request.url).searchParams.get("q") || "";
    if (!q.trim()) {
      return NextResponse.json(
        { success: false, message: "Add a keyword: /api/serp?q=your-keyword" },
        { status: 400 }
      );
    }

    if (!hasSerperKey()) {
      return NextResponse.json(
        { success: false, message: "SERPER_API_KEY is not set. Sign up free at serper.dev and add it to .env." },
        { status: 503 }
      );
    }

    const serp = await fetchSerp(q);
    if (!serp || serp.topResults.length === 0) {
      return NextResponse.json(
        { success: false, message: "No results. Try another keyword." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, keyword: q.trim(), ...serp });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SERP lookup failed.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
