import { db } from "@/db";
import { briefs, linkLibrary, contents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { LLMProvider } from "@/lib/llm/provider";
import { fetchSerp } from "@/lib/serp";
import { 
  researchPrompt,
  outlinePrompt,
  writerOpeningPrompt,
  writerSectionPrompt,
  writerClosingPrompt,
  packagingPrompt,
  humanEditorPrompt,
  safeJsonParse,
  ARCHETYPE_POOLS,
  BANNED_AI_PHRASES,
  type ProjectContext,
} from "./prompts";

// The 5 generation stages. Each HTTP request runs exactly ONE stage,
// so no request ever hits the serverless timeout. The browser calls
// the step API again and again until every stage is done.

export const STAGES = ["research", "outline", "writing", "packaging", "finalizing"] as const;
export type StageName = (typeof STAGES)[number];

// Labels shown in the progress bar.
export const STAGE_LABELS: Record<StageName, string> = {
  research: "Researching — understanding what the reader wants",
  outline: "Outlining — building unique article structure",
  writing: "Writing & Human Editing — drafting & humanizing",
  packaging: "Packaging — meta tags, FAQ and image prompts",
  finalizing: "Finalizing — checking and saving",
};

// Brief shape. Kept loose because researchData/outline come from jsonb.
export interface BriefShape {
  id: number;
  projectId: number;
  keywordId: number;
  customTitle?: string | null;
  contentType: string;
  audience?: string | null;
  secondaryKeywords?: unknown;
  targetWords?: number | null;
  tone?: string | null;
  extraInstructions?: string | null;
  researchData?: Record<string, unknown> | null;
  outline?: Record<string, unknown> | null;
  status?: string | null;
}

export interface StageContext {
  brief: BriefShape;
  ctx: ProjectContext;
  provider: LLMProvider;
}

// Helpers for Archetypes & Variety (Part 2)
export function selectArchetype(
  contentType: string,
  seed: number,
  versionNumber: number = 1
): { id: string; name: string; description: string; structure: string } {
  const pool = ARCHETYPE_POOLS[contentType] || ARCHETYPE_POOLS.blog_post;
  if (!pool || pool.length === 0) {
    return {
      id: "practical_guide",
      name: "Practical Guide",
      description: "Structured practical guide",
      structure: "Overview -> Key steps -> Best practices -> Checklist",
    };
  }
  // Deterministic rotation based on seed and version
  const idx = Math.abs(seed + (versionNumber - 1) * 7) % pool.length;
  return pool[idx];
}

export function selectBuildingBlocks(
  keyword: string,
  _contentType: string,
  seed: number
): string[] {
  const kwLower = keyword.toLowerCase();
  const needsTable =
    /\b(cost|price|pricing|vs|versus|comparison|compare|best|review|rates|calculator|budget)\b/i.test(kwLower) ||
    seed % 3 === 0;

  const blocks: string[] = [];
  if (needsTable) {
    blocks.push("table");
  }

  const otherPool = ["numbered_steps", "bullets", "pros_cons", "callout_quote", "checklist"];
  const pick1 = otherPool[Math.abs(seed) % otherPool.length];
  const pick2 = otherPool[Math.abs(seed + 3) % otherPool.length];

  blocks.push(pick1);
  if (pick2 !== pick1 && blocks.length < 3) {
    blocks.push(pick2);
  }
  if (blocks.length < 2) {
    blocks.push("callout_quote");
  }

  return Array.from(new Set(blocks));
}

export function generateRandomTextures(seed: number): string[] {
  const texturePool = [
    "Include a 2-3 sentence real-world field scenario or client situation (e.g. 'In a recent commercial project, we found...').",
    "Include one sharp rhetorical question that challenges conventional industry advice.",
    "Ensure each paragraph in this section contains at least one punchy sentence under 8 words.",
    "Include a specific caution or mistake warning based on real field experience.",
    "Contrast standard theory with what actually happens on the ground in real operating conditions.",
  ];

  const t1 = texturePool[Math.abs(seed) % texturePool.length];
  const t2 = texturePool[Math.abs(seed + 1) % texturePool.length];
  const t3 = texturePool[Math.abs(seed + 2) % texturePool.length];

  return [t1, t2 !== t1 ? t2 : texturePool[3], t3];
}

// Builds the project context every stage needs.
export async function buildContext(
  brief: BriefShape,
  project: {
    id: number;
    name?: string;
    targetCountry?: string | null;
    targetCity?: string | null;
    language?: string | null;
    industry?: string | null;
    audience?: string | null;
    businessDescription?: string | null;
    productsServices?: string | null;
    competitors?: string | null;
    settings?: unknown;
  },
  keyword: { id?: number; keyword: string },
  brandVoice: Record<string, unknown> | null,
  generationId?: number
): Promise<ProjectContext> {
  const projectSettings = (typeof project.settings === "object" && project.settings !== null ? project.settings as Record<string, unknown> : {});
  const siteType = (projectSettings.siteType as "local" | "global") || (project.targetCity ? "local" : "global");

  const seed = (generationId || brief.id || 1) * 37 + (keyword.id || 1) * 19;

  let versionNumber = 1;
  try {
    const older = await db.query.contents.findMany({
      columns: { id: true },
      where: and(eq(contents.projectId, project.id), eq(contents.keywordId, brief.keywordId)),
    });
    versionNumber = older.length + 1;
  } catch {
    // Fallback to version 1
  }

  const archetype = selectArchetype(brief.contentType, seed, versionNumber);
  const selectedBlocks = selectBuildingBlocks(keyword.keyword, brief.contentType, seed);
  const randomTextures = generateRandomTextures(seed);

  return {
    keyword: keyword.keyword,
    customTitle: brief.customTitle || null,
    siteType,
    country: project.targetCountry || "IN",
    city: project.targetCity,
    language: project.language || "en",
    industry: project.industry,
    audience: project.audience || brief.audience || null,
    businessDescription: project.businessDescription,
    productsServices: project.productsServices,
    competitors: project.competitors,
    contentType: brief.contentType,
    targetWords: brief.targetWords || 1200,
    tone: brief.tone || "simple English",
    secondaryKeywords: (brief.secondaryKeywords as string[]) || [],
    extraInstructions: brief.extraInstructions,
    generationSeed: seed,
    versionNumber,
    archetype,
    selectedBlocks,
    randomTextures,
    brandVoice: brandVoice
      ? {
          tone: (brandVoice.tone as string) || null,
          readingLevel: (brandVoice.readingLevel as string) || null,
          mustUseWords: brandVoice.mustUseWords,
          bannedWords: brandVoice.bannedWords,
          authorName: (brandVoice.authorName as string) || null,
          authorBio: (brandVoice.authorBio as string) || null,
          sampleWriting: (brandVoice.sampleWriting as string) || null,
        }
      : null,
  };
}

// STAGE 2 — RESEARCH

export async function runResearchStage(sc: StageContext) {
  const { system, user } = researchPrompt(sc.ctx);

  let data: Record<string, unknown> = {};
  let tokensIn = 0;
  let tokensOut = 0;

  try {
    const res = await sc.provider.complete({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      jsonMode: true,
      temperature: 0.5,
      maxTokens: 3500,
    });
    tokensIn = res.tokensIn;
    tokensOut = res.tokensOut;
    data = safeJsonParse(res.text, {});
  } catch {
    data = {
      search_intent: "informational",
      intent_summary: `The reader wants a clear, practical guide to ${sc.ctx.keyword}.`,
      top_results: [],
      people_also_ask: [
        `What is the cost of ${sc.ctx.keyword}?`,
        `How does ${sc.ctx.keyword} work?`,
        `What is the best way to choose ${sc.ctx.keyword}?`,
        `How long does ${sc.ctx.keyword} last?`,
        `What mistakes should I avoid with ${sc.ctx.keyword}?`,
      ],
      facts: [],
      statistics: [],
      definitions: [],
      content_gaps: ["Practical real-world nuances", "Transparent cost factors"],
      common_mistakes: ["Focusing only on price", "Ignoring long-term durability"],
      buying_criteria: ["Quality track record", "Transparent pricing", "Warranty"],
      local_facts: sc.ctx.city ? [`Local standards in ${sc.ctx.city}`] : [],
      risks: ["Low-quality materials", "Poor execution"],
    };
  }

  // Real Google SERP results via Serper.dev
  try {
    const serp = await fetchSerp(sc.ctx.keyword);
    if (serp && serp.topResults && serp.topResults.length > 0) {
      data.top_results = serp.topResults;
      if (serp.peopleAlsoAsk && serp.peopleAlsoAsk.length > 0) {
        data.people_also_ask = serp.peopleAlsoAsk;
      }
      if (serp.relatedSearches && serp.relatedSearches.length > 0) {
        data.related_searches = serp.relatedSearches;
      }
      data.serp_source = "serper.dev";
    } else {
      data.serp_source = "ai-fallback";
    }
  } catch (err) {
    data.serp_source = "ai-fallback";
    data.serp_error = err instanceof Error ? err.message : "SERP lookup failed.";
  }

  await db
    .update(briefs)
    .set({ researchData: data, status: "outline" })
    .where(eq(briefs.id, sc.brief.id));

  return {
    tokensIn,
    tokensOut,
    preview: String(data.intent_summary || "").slice(0, 220),
  };
}

// STAGE 3 — OUTLINE

export async function runOutlineStage(sc: StageContext) {
  const research = (sc.brief.researchData || {}) as Record<string, unknown>;
  const { system, user } = outlinePrompt(sc.ctx, research);

  type OutlineData = {
    h1?: string;
    angle?: string;
    sections?: Array<{
      heading: string;
      target_words?: number;
      purpose?: string;
      key_points?: string[];
      block_type?: string;
    }>;
    faq_questions?: string[];
    closing_cta?: string;
    outline_source?: string;
    _meta?: {
      archetype?: unknown;
      selectedBlocks?: string[];
      randomTextures?: string[];
    };
  };

  let data: OutlineData | null = null;
  let tokensIn = 0;
  let tokensOut = 0;

  for (let attempt = 0; attempt < 2 && !data; attempt++) {
    const res = await sc.provider.complete({
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      jsonMode: true,
      temperature: attempt === 0 ? 0.6 : 0.2,
      maxTokens: 3500,
    });
    tokensIn = res.tokensIn;
    tokensOut = res.tokensOut;
    const parsed = safeJsonParse<OutlineData>(res.text, {});
    if (parsed.sections && Array.isArray(parsed.sections) && parsed.sections.length >= 3) {
      data = { ...parsed, outline_source: "ai" };
    }
  }

  // Last resort fallback
  if (!data) {
    const kw = sc.ctx.keyword;
    const paa = (research.people_also_ask as string[]) || [];
    data = {
      h1: kw,
      angle: "practical guide",
      sections: [
        { heading: `${kw} — Overview`, purpose: "Explain the basics", key_points: ["What it is", "Who needs it"], block_type: "none" },
        { heading: `Benefits of ${kw}`, purpose: "Why it matters", key_points: ["Main advantages", "Who gains most"], block_type: "bullets" },
        { heading: `How to Choose the Right ${kw}`, purpose: "Decision help", key_points: ["What to compare", "Red flags"], block_type: "checklist" },
        { heading: `${kw} Cost and Pricing`, purpose: "Budget clarity", key_points: ["Typical price ranges", "What affects cost"], block_type: "table" },
        { heading: `Mistakes to Avoid with ${kw}`, purpose: "Save the reader trouble", key_points: ["Common errors", "Pro tips"], block_type: "callout_quote" },
      ],
      faq_questions: paa.slice(0, 5).length >= 3 ? paa.slice(0, 5) : [
        `What is the cost of ${kw}?`,
        `How long does ${kw} take?`,
        `Who should choose ${kw}?`,
      ],
      closing_cta: `Ready to start with ${kw}? Contact us today.`,
      outline_source: "fallback",
    };
  }

  // Strictly enforce user's custom title if specified
  if (sc.ctx.customTitle?.trim()) {
    data.h1 = sc.ctx.customTitle.trim();
  }

  // Preserve metadata about the selected archetype and blocks
  data._meta = {
    archetype: sc.ctx.archetype,
    selectedBlocks: sc.ctx.selectedBlocks,
    randomTextures: sc.ctx.randomTextures,
  };

  await db
    .update(briefs)
    .set({ outline: data, status: "writing" })
    .where(eq(briefs.id, sc.brief.id));

  return {
    tokensIn,
    tokensOut,
    preview: `${data.h1 || sc.ctx.keyword} (${(data.sections || []).length} sections, archetype: ${sc.ctx.archetype?.name || "Standard"})`,
  };
}

// STAGE 4 — WRITER & HUMAN EDITOR PASS

interface DraftShape {
  written: Array<{ heading: string; markdown: string }>;
  polishedDraft?: string;
}

export async function runWritingStage(sc: StageContext) {
  const outline = (sc.brief.outline || {}) as {
    h1?: string;
    angle?: string;
    sections?: Array<{
      heading: string;
      target_words?: number;
      purpose?: string;
      key_points?: string[];
      block_type?: string;
    }>;
    faq_questions?: string[];
    closing_cta?: string;
    _draft?: DraftShape;
    _meta?: {
      archetype?: unknown;
      selectedBlocks?: string[];
      randomTextures?: string[];
    };
  };

  const research = (sc.brief.researchData || {}) as Record<string, unknown>;
  const sections = outline.sections || [];
  const written: Array<{ heading: string; markdown: string }> = outline._draft?.written || [];

  // Full plan: 1 opening + N sections + 1 FAQ + 1 closing + 1 human editor pass.
  const totalPieces = 1 + sections.length + 1 + 1 + 1;
  const done = written.length;

  let pieceTitle = "";
  let markdown = "";

  if (done === 0) {
    // Piece 1: Opening.
    const p = writerOpeningPrompt(sc.ctx, research, outline, sections[0]?.heading || "Overview");
    const res = await sc.provider.complete({
      messages: [
        { role: "system", content: p.system },
        { role: "user", content: p.user },
      ],
      temperature: sc.ctx.mode === "humanized" ? 0.95 : 0.75,
      maxTokens: 1200,
    });
    markdown = res.text.trim();
    pieceTitle = "Opening";
    return await savePiece(sc, outline, written, pieceTitle, markdown, sections.length + 4, done + 1, totalPieces, res.tokensIn, res.tokensOut);
  }

  if (done >= 1 && done <= sections.length) {
    // Pieces 2..N+1: Sections with building blocks & random texture
    const idx = done - 1;
    const section = sections[idx];
    const blockType = section.block_type || sc.ctx.selectedBlocks?.[idx % (sc.ctx.selectedBlocks?.length || 1)] || "none";
    const sectionTexture = sc.ctx.randomTextures?.[idx % (sc.ctx.randomTextures?.length || 1)];

    const p = writerSectionPrompt(
      sc.ctx,
      research,
      outline,
      {
        heading: section.heading,
        target_words: section.target_words || 250,
        purpose: section.purpose,
        key_points: section.key_points,
        blockType,
      },
      idx,
      sections.length,
      written.map((w) => w.heading),
      sectionTexture
    );
    const res = await sc.provider.complete({
      messages: [
        { role: "system", content: p.system },
        { role: "user", content: p.user },
      ],
      temperature: sc.ctx.mode === "humanized" ? 0.95 : 0.75,
      maxTokens: Math.min((section.target_words || 250) * 3 + 800, 8000),
    });
    markdown = res.text.trim();

    if (!markdown.startsWith("##")) {
      markdown = `## ${section.heading}\n\n${markdown}`;
    }
    pieceTitle = section.heading;
    return await savePiece(sc, outline, written, pieceTitle, markdown, sections.length + 4, done + 1, totalPieces, res.tokensIn, res.tokensOut);
  }

  if (done === sections.length + 1) {
    // Piece: FAQ placeholder (real answers come from the packaging stage)
    const faqQs = outline.faq_questions || [];
    markdown = `## Frequently asked questions\n\n${faqQs.map((q) => `### ${q}\n\n_(answer added in the next step)_`).join("\n\n")}`;
    pieceTitle = "FAQ";
    return await savePiece(sc, outline, written, pieceTitle, markdown, sections.length + 4, done + 1, totalPieces, 0, 0);
  }

  if (done === sections.length + 2) {
    // Piece: Closing.
    const p = writerClosingPrompt(sc.ctx, outline, written.map((w) => w.heading));
    const res = await sc.provider.complete({
      messages: [
        { role: "system", content: p.system },
        { role: "user", content: p.user },
      ],
      temperature: sc.ctx.mode === "humanized" ? 0.9 : 0.7,
      maxTokens: 1500,
    });
    markdown = res.text.trim();
    pieceTitle = "Closing";

    const result = await savePiece(
      sc,
      outline,
      written,
      pieceTitle,
      markdown,
      sections.length + 4,
      done + 1,
      totalPieces,
      res.tokensIn,
      res.tokensOut
    );

    result.preview = "All sections drafted — preparing Chief Human Editor review pass...";
    return result;
  }

  if (done === sections.length + 3) {
    // Final Piece: Chief Human Editor Pass (Part 1.B)
    const fullDraft = written.map((w) => w.markdown).join("\n\n");
    let polished = fullDraft;
    let tokensIn = 0;
    let tokensOut = 0;

    try {
      const editor = humanEditorPrompt(sc.ctx, fullDraft);
      const res = await sc.provider.complete({
        messages: [
          { role: "system", content: editor.system },
          { role: "user", content: editor.user },
        ],
        temperature: 0.65,
        maxTokens: Math.min(countWords(fullDraft) * 2 + 1000, 8000),
      });
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
      if (res.text && countWords(res.text) >= countWords(fullDraft) * 0.7) {
        polished = res.text.trim();
      }
    } catch (err) {
      console.warn("Human editor pass warning, continuing with draft:", err);
    }

    // Save polished draft and advance to packaging
    const updated = {
      ...outline,
      _draft: {
        ...outline._draft,
        written,
        polishedDraft: polished,
      },
    };
    await db.update(briefs).set({ outline: updated, status: "packaging" }).where(eq(briefs.id, sc.brief.id));

    return {
      tokensIn,
      tokensOut,
      preview: "Human Editor: Robotic cadence removed, rhythm balanced & human touches polished",
      wordsSoFar: countWords(polished),
    };
  }

  // Fallback
  await db.update(briefs).set({ status: "packaging" }).where(eq(briefs.id, sc.brief.id));
  return {
    tokensIn: 0,
    tokensOut: 0,
    preview: "Writing complete. Moving to packaging.",
    wordsSoFar: written.reduce((a, b) => a + countWords(b.markdown), 0),
  };
}

// Appends one piece (opening/section/closing) to the draft.
async function savePiece(
  sc: StageContext,
  outline: Record<string, unknown> & { _draft?: DraftShape; sections?: unknown[] },
  written: Array<{ heading: string; markdown: string }>,
  heading: string,
  markdown: string,
  _plannedSections: number,
  doneCount: number,
  totalPieces: number,
  tokensIn: number,
  tokensOut: number
) {
  const updated = { ...outline, _draft: { written: [...written, { heading, markdown }] } };
  await db.update(briefs).set({ outline: updated }).where(eq(briefs.id, sc.brief.id));

  const totalWords = [...written, { heading, markdown }]
    .map((w) => countWords(w.markdown))
    .reduce((a, b) => a + b, 0);

  return {
    tokensIn,
    tokensOut,
    preview: `${doneCount} / ${totalPieces} pieces written — ${totalWords} words so far`,
    wordsSoFar: totalWords,
  };
}

// STAGE 5 — PACKAGING (meta + FAQ answers + image prompts)

export async function runPackagingStage(sc: StageContext) {
  const outline = (sc.brief.outline || {}) as {
    h1?: string;
    faq_questions?: string[];
    _draft?: DraftShape;
  };
  const research = (sc.brief.researchData || {}) as Record<string, unknown>;
  const written = outline._draft?.written || [];
  const article = outline._draft?.polishedDraft || written.map((w) => w.markdown).join("\n\n");

  const { system, user } = packagingPrompt(sc.ctx, research, outline, article);
  const res = await sc.provider.complete({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    jsonMode: true,
    temperature: 0.5,
    maxTokens: 4000,
  });

  const data = safeJsonParse<Record<string, unknown>>(res.text, {});

  if (!data.meta_title) {
    throw new Error("Packaging stage returned no meta title. Retry.");
  }

  await db
    .update(briefs)
    .set({
      outline: {
        ...outline,
        _packaging: data,
      },
      status: "finalizing",
    })
    .where(eq(briefs.id, sc.brief.id));

  return {
    tokensIn: res.tokensIn,
    tokensOut: res.tokensOut,
    preview: `Meta: "${data.meta_title}" · ${(data.faq as unknown[])?.length || 0} FAQs`,
  };
}

// STAGE 6 — FINALIZING HELPERS

export function replaceFaqPlaceholder(
  body: string,
  faq: Array<{ question: string; answer: string }>
): string {
  if (!faq.length) return body;

  const realFaqSection = [
    "## Frequently asked questions",
    "",
    ...faq.flatMap((f) => [`### ${f.question}`, "", f.answer, ""]),
  ].join("\n");

  const hasPlaceholder = /## Frequently asked questions[\s\S]*?(?=\n## |\n# |$)/i.test(body);

  if (hasPlaceholder) {
    return body.replace(/## Frequently asked questions[\s\S]*?(?=\n## |\n# |$)/i, realFaqSection + "\n");
  }

  return `${body}\n\n${realFaqSection}`;
}

export function humanizeText(text: string): string {
  let cleaned = text;

  // Replace remaining banned AI phrases
  const replacements: Array<[RegExp, string]> = [
    [/\bdelve into\b/gi, "look closely at"],
    [/\bdive into\b/gi, "explore"],
    [/\bin today's digital landscape\b/gi, "today"],
    [/\bin today's fast-paced world\b/gi, "today"],
    [/\bin today's world\b/gi, "nowadays"],
    [/\bit is important to note that\b/gi, "keep in mind that"],
    [/\bit's important to note that\b/gi, "note that"],
    [/\bit is worth noting that\b/gi, "notably,"],
    [/\bgame-changer\b/gi, "major turning point"],
    [/\bseamlessly\b/gi, "smoothly"],
    [/\bseamless\b/gi, "smooth"],
    [/\bleverage\b/gi, "use"],
    [/\butilize\b/gi, "use"],
    [/\bplethora of\b/gi, "wide range of"],
    [/\bmyriad of\b/gi, "many"],
    [/\btestament to\b/gi, "proof of"],
    [/\bwhen it comes to\b/gi, "with"],
    [/\bcutting-edge\b/gi, "modern"],
    [/\belevate\b/gi, "improve"],
    [/\bunlock\b/gi, "gain"],
  ];

  for (const [pattern, replacement] of replacements) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  // Remove any stray emojis
  cleaned = cleaned.replace(
    /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,
    ""
  );

  return cleaned;
}

export async function injectLinks(
  projectId: number,
  article: string,
  research: Record<string, unknown>
): Promise<{ internal: unknown[]; external: unknown[] }> {
  const links = await db.query.linkLibrary.findMany({
    where: eq(linkLibrary.projectId, projectId),
    limit: 20,
  });

  const internal: Array<{ anchor: string; url: string; section: string }> = [];
  for (const link of links) {
    const options = (link.anchorOptions || []) as string[];
    const anchor = options[0] || link.pageTitle || link.h1;
    if (anchor && link.url) {
      if (article.toLowerCase().includes(String(anchor).toLowerCase().slice(0, 25))) {
        internal.push({ anchor: String(anchor).slice(0, 60), url: link.url, section: "body" });
      }
    }
  }

  const topResults = (research.top_results as Array<{ title: string; url: string }>) || [];
  const external = topResults.slice(0, 3).map((r) => ({
    anchor: r.title || "reference",
    url: r.url,
    domain: (() => {
      try {
        return new URL(r.url).hostname.replace("www.", "");
      } catch {
        return "example.com";
      }
    })(),
    rel: "noopener",
    note: "industry reference source",
  }));

  return { internal, external };
}

// VALIDATION & HUMAN-FEEL SCORE (Part 1.C)

export function validateContent(
  text: string,
  meta: { meta_title?: string; meta_description?: string },
  primaryKeyword: string,
  targetWords: number
) {
  const words = countWords(text);
  const h1Count = (text.match(/^# /gm) || []).length;
  const h2Count = (text.match(/^## /gm) || []).length;
  const h3Count = (text.match(/^### /gm) || []).length;
  const keywordCount = primaryKeyword
    ? (text.toLowerCase().match(new RegExp(primaryKeyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length
    : 0;
  const density = words > 0 ? (keywordCount / words) * 100 : 0;

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgSentence = sentences.length ? words / sentences.length : 0;
  const syllables = syllableCount(text);
  const flesch = words > 0 ? Math.max(0, 206.835 - 1.015 * avgSentence - 84.6 * (syllables / words)) : 0;

  // 1. Banned AI Phrases Check
  const bannedMatches: string[] = [];
  for (const phrase of BANNED_AI_PHRASES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    const count = (text.match(regex) || []).length;
    if (count > 0) {
      bannedMatches.push(`${phrase} (${count})`);
    }
  }

  // 2. Contractions check (natural speech uses contractions)
  const contractionRegex = /\b(don't|doesn't|didn't|won't|can't|couldn't|shouldn't|wouldn't|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|it's|that's|what's|there's|who's|we're|they're|you're|we've|they've|you've|i've|we'll|they'll|you'll|i'll)\b/gi;
  const contractionsCount = (text.match(contractionRegex) || []).length;

  // 3. Em-dash check (max 2 allowed)
  const emDashCount = (text.match(/—|--/g) || []).length;

  // 4. Sentence length variance (burstiness: std deviation in words)
  const sentenceWordCounts = sentences.map((s) => s.trim().split(/\s+/).filter(Boolean).length).filter((len) => len > 0);
  let sentenceVariance = 0;
  if (sentenceWordCounts.length > 1) {
    const mean = sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length;
    const sqDiffs = sentenceWordCounts.map((len) => Math.pow(len - mean, 2));
    sentenceVariance = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / sentenceWordCounts.length);
  }

  // 5. First-person lived experience indicators
  const experienceRegex = /\b(we've seen|in our experience|we tested|we noticed|one client|our team|on the ground|we recommend|we found|in practice)\b/gi;
  const experienceCount = (text.match(experienceRegex) || []).length;

  // 6. Human-feel Score Calculation (0-100)
  let humanScore = 75;
  humanScore -= Math.min(40, bannedMatches.length * 8);

  if (contractionsCount >= 6) humanScore += 10;
  else if (contractionsCount >= 3) humanScore += 5;
  else if (contractionsCount === 0) humanScore -= 15;

  if (sentenceVariance >= 7.0) humanScore += 10;
  else if (sentenceVariance >= 5.0) humanScore += 5;
  else if (sentenceVariance < 3.5) humanScore -= 10;

  if (emDashCount <= 2) humanScore += 5;
  else humanScore -= Math.min(15, (emDashCount - 2) * 5);

  if (experienceCount >= 2) humanScore += 5;

  humanScore = Math.max(10, Math.min(100, Math.round(humanScore)));

  const report = [
    { rule: "h1_count", status: h1Count === 1 ? "pass" : "fail", value: h1Count, hint: "Exactly one H1 required" },
    { rule: "h2_count", status: h2Count >= 4 ? "pass" : "warn", value: h2Count, hint: "At least 4 H2 sections" },
    { rule: "word_count", status: words >= targetWords * 0.7 ? "pass" : "warn", value: words, hint: `Target ${targetWords} words` },
    {
      rule: "keyword_density",
      status: density >= 0.4 && density <= 2.0 ? "pass" : "warn",
      value: Number(density.toFixed(2)),
      hint: "Keep between 0.4% and 2%",
    },
    { rule: "avg_sentence", status: avgSentence <= 25 ? "pass" : "warn", value: Number(avgSentence.toFixed(1)), hint: "Sentences under 25 words" },
    {
      rule: "human_feel_score",
      status: humanScore >= 75 ? "pass" : humanScore >= 60 ? "warn" : "fail",
      value: `${humanScore} / 100`,
      hint: humanScore >= 75 ? "Natural human tone and varied sentence cadence" : "Robotic tone detected — edit for cadence and voice",
    },
    {
      rule: "banned_ai_phrases",
      status: bannedMatches.length === 0 ? "pass" : "fail",
      value: bannedMatches.length === 0 ? "0 detected" : `${bannedMatches.length} detected: ${bannedMatches.slice(0, 3).join(", ")}`,
      hint: "Zero robotic AI phrases allowed",
    },
    {
      rule: "sentence_variance",
      status: sentenceVariance >= 5.0 ? "pass" : "warn",
      value: `±${sentenceVariance.toFixed(1)} words`,
      hint: "Burstiness: healthy mix of short (<8 words) and longer sentences",
    },
    {
      rule: "contractions_used",
      status: contractionsCount >= 4 ? "pass" : "warn",
      value: `${contractionsCount} contractions`,
      hint: "Conversational writing uses natural contractions (don't, we're)",
    },
    {
      rule: "em_dash_count",
      status: emDashCount <= 2 ? "pass" : "warn",
      value: `${emDashCount} em-dashes`,
      hint: "Max 2 em-dashes across article to avoid AI formatting habit",
    },
    {
      rule: "meta_title_length",
      status: (meta.meta_title?.length || 0) >= 30 && (meta.meta_title?.length || 0) <= 65 ? "pass" : "warn",
      value: meta.meta_title?.length || 0,
      hint: "30-65 characters",
    },
    {
      rule: "meta_desc_length",
      status: (meta.meta_description?.length || 0) >= 120 && (meta.meta_description?.length || 0) <= 165 ? "pass" : "warn",
      value: meta.meta_description?.length || 0,
      hint: "120-165 characters",
    },
  ];

  const passes = report.filter((r) => r.status === "pass").length;
  const qualityScore = Math.round((passes / report.length) * 100);

  return {
    words,
    h1Count,
    h2Count,
    h3Count,
    keywordCount,
    keywordDensity: Number(density.toFixed(3)),
    readability: { flesch: Number(flesch.toFixed(1)) },
    avgSentence: Number(avgSentence.toFixed(1)),
    humanScore,
    humanReport: {
      score: humanScore,
      bannedCount: bannedMatches.length,
      bannedMatches,
      contractionsCount,
      emDashCount,
      sentenceVariance: Number(sentenceVariance.toFixed(1)),
      experienceCount,
      status: humanScore >= 75 ? "pass" : humanScore >= 60 ? "warn" : "fail",
    },
    report,
    qualityScore,
  };
}

// JSON-LD schema, including FAQPage, LocalBusiness & Author (Google rich results).
export function buildSchemaJson(
  contentType: string,
  meta: { meta_title?: string; meta_description?: string; slug?: string },
  faq: Array<{ question: string; answer: string }>,
  siteUrl?: string,
  projectDetails?: {
    siteType?: "local" | "global" | null;
    projectName?: string;
    city?: string | null;
    country?: string | null;
    authorName?: string | null;
    authorBio?: string | null;
  }
) {
  const type =
    contentType === "blog_post" ? "BlogPosting" : contentType === "service_page" ? "Service" : "Article";

  const authorSchema = projectDetails?.authorName
    ? {
        "@type": "Person",
        name: projectDetails.authorName,
        description: projectDetails.authorBio || undefined,
      }
    : undefined;

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    headline: meta.meta_title,
    description: meta.meta_description,
    ...(siteUrl && meta.slug ? { url: `${siteUrl}/${meta.slug}` } : {}),
    ...(authorSchema ? { author: authorSchema } : {}),
  };

  const graph: Array<Record<string, unknown>> = [base];

  if (faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }

  if (projectDetails?.siteType === "local") {
    graph.push({
      "@type": "LocalBusiness",
      name: projectDetails.projectName || "Local Business",
      address: {
        "@type": "PostalAddress",
        addressLocality: projectDetails.city || undefined,
        addressCountry: projectDetails.country || "IN",
      },
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function syllableCount(text: string): number {
  return text.toLowerCase().split(/[^aeiouy]+/).filter(Boolean).length;
}
