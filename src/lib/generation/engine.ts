import { db } from "@/db";
import {
  briefs,
  contents,
  keywords,
  projects,
  brandVoices,
  generations,
  creditsLedger,
  users,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createLLMProvider, getProviderInfo } from "@/lib/llm/factory";
import { sendEmail, articleReadyEmail } from "@/lib/email";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import { getSiteUrl } from "@/lib/site-url";
import {
  runResearchStage,
  runOutlineStage,
  runWritingStage,
  runPackagingStage,
  buildContext,
  humanizeText,
  replaceFaqPlaceholder,
  injectLinks,
  validateContent,
  buildSchemaJson,
  countWords,
  STAGES,
  STAGE_LABELS,
  type StageName,
  type StageContext,
  type BriefShape,
} from "./stages";

// Engine: the manager of the whole process.
// It takes orders, keeps accounts, and reports errors clearly.
// The actual writing work happens in stages.ts.
//
// Three public functions:
//   1. createGenerationJob() -> start the job (cut credit, create brief)
//   2. runNextStage()        -> run the next step (browser calls again and again)
//   3. getGenerationState()  -> report "how far along?"

const CREDITS_PER_ARTICLE = 1;
const USD_PER_TOKEN = 0.0000003; // Rough Gemini 2.5 Flash estimate.

// 1. START THE JOB

export interface CreateJobInput {
  projectId: number;
  keywordId: number;
  userId: number;
  customTitle?: string | null;
  contentType: string;
  targetWords: number;
  tone: string;
  extraInstructions?: string;
  secondaryKeywords?: string[];
  mode?: "ai" | "humanized";
}

export async function createGenerationJob(input: CreateJobInput) {
  const provider = createLLMProvider(); // No key? Clear error right here.

  // Check 1: user + credits.
  const user = await db.query.users.findFirst({ where: eq(users.id, input.userId) });
  if (!user) throw new Error("User not found. Please log in again.");
  if (user.credits < CREDITS_PER_ARTICLE) {
    throw new Error("Credits exhausted. Top up from Settings.");
  }

  // Check 2: is this project mine?
  const project = await db.query.projects.findFirst({
    where: and(eq(projects.id, input.projectId), eq(projects.userId, input.userId)),
  });
  if (!project) throw new Error("Project not found, or it is not yours.");

  // Check 3: business description too short for the AI to understand.
  if ((project.businessDescription || "").length < 100) {
    throw new Error(
      "Business description is too short (under 100 characters). Add some detail in project settings — it makes the article 10x better."
    );
  }

  // Check 4: does this keyword belong to this project?
  const keyword = await db.query.keywords.findFirst({
    where: and(eq(keywords.id, input.keywordId), eq(keywords.projectId, input.projectId)),
  });
  if (!keyword) throw new Error("Keyword not found.");
// Repeat version? Count older articles on this exact keyword so the
  // AI can be told to write a completely fresh version (new angle,
  // new examples, new structure — never a copy of the earlier ones).
  const older = await db.query.contents.findMany({
    columns: { id: true },
    where: and(eq(contents.projectId, input.projectId), eq(contents.keywordId, input.keywordId)),
  });
  const freshnessNote = [
    input.extraInstructions,
    older.length > 0
      ? `IMPORTANT: ${older.length} article(s) on this exact keyword already exist. This is version ${older.length + 1}. Write a completely fresh article — new angle, new examples, new structure, new wording. Do NOT repeat sentences from the earlier versions.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  

  // Check 5: YMYL (Your Money Your Life) keyword?
  // Google is extra strict on these topics, so we mark them.
  const ymyl = /\b(loan|insurance|tax|medicine|medical|legal|investment|surgery|visa|crypto|child safety|health)\b/i.test(
    keyword.keyword
  );

  // Create the brief (the article's rough plan).
  const [brief] = await db
    .insert(briefs)
    .values({
      projectId: input.projectId,
      keywordId: input.keywordId,
      customTitle: input.customTitle?.trim() || null,
      contentType: input.contentType,
      audience: project.audience || "business decision makers",
      secondaryKeywords: input.secondaryKeywords || [],
      targetWords: input.targetWords,
      tone: input.tone,
      extraInstructions: freshnessNote,
      status: "research", // First stage.
      needsFacts: ymyl,
    })
    .returning();

  // Cut the credit (AND write the ledger entry — accounts must always balance).
  const newBalance = user.credits - CREDITS_PER_ARTICLE;
  await db.update(users).set({ credits: newBalance }).where(eq(users.id, input.userId));
  await db.insert(creditsLedger).values({
    userId: input.userId,
    change: -CREDITS_PER_ARTICLE,
    reason: `Article generation started (keyword: ${keyword.keyword})`,
    referenceId: brief.id,
    balanceAfter: newBalance,
  });

  // Generation record (which model, how long, what cost).
  const [gen] = await db
    .insert(generations)
    .values({
      userId: input.userId,
      projectId: input.projectId,
      status: "queued",
      creditsUsed: CREDITS_PER_ARTICLE,
      modelName: provider.name,
      promptVersion: input.mode === "humanized" ? "humanized-1" : "2",
      stageTimings: { startedAt: new Date().toISOString() },
    })
    .returning();

  return {
    generationId: gen.id,
    briefId: brief.id,
    keyword: keyword.keyword,
    ymyl,
    provider: getProviderInfo(),
    totalStages: STAGES.length,
    estimatedSeconds: 90,
  };
}

// 2. RUN THE NEXT STEP

export interface StageResult {
  stage: StageName;
  stageLabel: string;
  done: boolean;
  progress: number; // 0 - 100
  message: string;
  contentId?: number;
  error?: string;
}

export async function runNextStage(generationId: number, userId: number): Promise<StageResult> {
  // Load everything.
  const gen = await db.query.generations.findFirst({ where: eq(generations.id, generationId) });
  if (!gen) throw new Error("Generation not found.");
  if (gen.userId !== userId) throw new Error("This is not your job.");

  if (gen.status === "completed" && gen.contentId) {
    return {
      stage: "finalizing",
      stageLabel: "Complete",
      done: true,
      progress: 100,
      message: "Article is already ready.",
      contentId: gen.contentId,
    };
  }
  if (gen.status === "refunded" || gen.status === "failed") {
    throw new Error(gen.errorMessage || "This generation has already failed.");
  }

  // Fetch this generation's latest brief (its status tells us
  // which stage to run now).
  const briefRows = await db.query.briefs.findMany({
    where: eq(briefs.projectId, gen.projectId),
    orderBy: (b, { desc }) => [desc(b.id)],
    limit: 1,
  });
  const activeBrief = briefRows[0] as BriefShape | undefined;
  if (!activeBrief) throw new Error("Brief not found.");

  const stage = (activeBrief.status || "research") as StageName;
  const stageIndex = STAGES.indexOf(stage);
  const progress = Math.round((stageIndex / STAGES.length) * 100);

  // Prepare everything.
  const keyword = await db.query.keywords.findFirst({
    where: eq(keywords.id, activeBrief.keywordId),
  });
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, activeBrief.projectId),
  });
  if (!keyword || !project) throw new Error("Keyword or project not found.");

  const brandVoiceRow = await db.query.brandVoices.findFirst({
    where: eq(brandVoices.projectId, activeBrief.projectId),
  });

  const provider = createLLMProvider();
  const ctx = await buildContext(
    activeBrief,
    project,
    keyword,
    brandVoiceRow as unknown as Record<string, unknown> | null,
    gen.id
  );
  const sc: StageContext = { brief: activeBrief, ctx, provider };
 // Humanized mode travels in promptVersion (no extra column needed):
  // "humanized-*" means humanize prompts, anything else means standard AI.
  if (gen.promptVersion?.startsWith("humanized")) {
    ctx.mode = "humanized";
  }
  const startedAt = Date.now();
  const timings = (gen.stageTimings as Record<string, unknown>) || {};

  try {
    // Run it.
    let result: { tokensIn: number; tokensOut: number; preview: string; wordsSoFar?: number };

    if (stage === "research") {
      result = await runResearchStage(sc);
    } else if (stage === "outline") {
      result = await runOutlineStage(sc);
    } else if (stage === "writing") {
      result = await runWritingStage(sc);
    } else if (stage === "packaging") {
      result = await runPackagingStage(sc);
    } else if (stage === "finalizing") {
      const contentId = await finalizeContent(gen.id, activeBrief, keyword, project);
      return {
        stage: "finalizing",
        stageLabel: "Complete",
        done: true,
        progress: 100,
        message: "Article is ready.",
        contentId,
      };
    } else {
      throw new Error(`Unknown stage: ${stage}`);
    }

    timings[stage] = {
      ms: Date.now() - startedAt,
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
    };

    // Update accounts after every step, so nothing is ever lost.
    const freshBrief = (await db.query.briefs.findFirst({
      where: eq(briefs.id, activeBrief.id),
    })) as BriefShape | undefined;
    const nextStage = (freshBrief?.status || stage) as StageName;
    const nextIndex = STAGES.indexOf(nextStage);

    await db
      .update(generations)
      .set({
        status: "running",
        tokensIn: (gen.tokensIn || 0) + result.tokensIn,
        tokensOut: (gen.tokensOut || 0) + result.tokensOut,
        apiCostUsd: String(((gen.tokensIn || 0) + (gen.tokensOut || 0) + result.tokensIn + result.tokensOut) * USD_PER_TOKEN),
        stageTimings: timings,
        durationMs: (gen.durationMs || 0) + (Date.now() - startedAt),
      })
      .where(eq(generations.id, gen.id));

    return {
      stage,
      stageLabel: STAGE_LABELS[stage],
      done: false,
      progress: Math.round((nextIndex / STAGES.length) * 100),
      message: result.preview,
    };
  } catch (error) {
    // Something failed -> REFUND the credit (user must never lose out).
    const message = error instanceof Error ? error.message : "Unknown error";

    await db.update(users).set({ credits: sql`${users.credits} + ${CREDITS_PER_ARTICLE}` }).where(eq(users.id, userId));

    const freshUser = await db.query.users.findFirst({ where: eq(users.id, userId) });
    await db.insert(creditsLedger).values({
      userId,
      change: CREDITS_PER_ARTICLE,
      reason: `Refund — generation #${gen.id} failed (${stage})`,
      referenceId: gen.id,
      balanceAfter: freshUser?.credits ?? 0,
    });

    await db
      .update(generations)
      .set({
        status: "refunded",
        errorMessage: `[${stage}] ${message}`,
        stageTimings: { ...timings, [stage]: { error: message, ms: Date.now() - startedAt } },
        durationMs: (gen.durationMs || 0) + (Date.now() - startedAt),
      })
      .where(eq(generations.id, gen.id));

    throw error;
  }
}

// 3. LAST STEP — join everything and save the article.

async function finalizeContent(
  generationId: number,
  brief: BriefShape,
  keyword: { id: number; keyword: string },
  project: {
    id: number;
    name?: string;
    targetCountry?: string | null;
    targetCity?: string | null;
    settings?: unknown;
  }
): Promise<number> {
  const outline = (brief.outline || {}) as {
    h1?: string;
    _draft?: {
      written: Array<{ heading: string; markdown: string }>;
      polishedDraft?: string;
    };
    _packaging?: {
      meta_title?: string;
      meta_description?: string;
      slug?: string;
      h1?: string;
      tags?: string[];
      category?: string;
      faq?: Array<{ question: string; answer: string }>;
      image_prompts?: unknown[];
      internal_link_suggestions?: unknown[];
    };
    _meta?: {
      archetype?: unknown;
      selectedBlocks?: string[];
      randomTextures?: string[];
    };
  };

  const research = (brief.researchData || {}) as Record<string, unknown>;
  const packaging = outline._packaging || {};
  const written = outline._draft?.written || [];

  if (!written.length) throw new Error("No article pieces found. Generate again.");

  const faq = packaging.faq || [];

  const brandVoiceRow = await db.query.brandVoices.findFirst({
    where: eq(brandVoices.projectId, project.id),
  });

  const projectSettings =
    typeof project.settings === "object" && project.settings !== null
      ? (project.settings as Record<string, unknown>)
      : {};
  const siteType =
    (projectSettings.siteType as "local" | "global") ||
    (project.targetCity ? "local" : "global");

  // 1. Join all pieces or use Chief Human Editor polished draft if available
  const h1 = brief.customTitle?.trim() || packaging.h1 || outline.h1 || `${keyword.keyword}: Practical Guide`;
  let body = outline._draft?.polishedDraft
    ? outline._draft.polishedDraft
    : `# ${h1}\n\n${written.map((w) => w.markdown).join("\n\n")}`;

  if (!body.startsWith("# ")) {
    body = `# ${h1}\n\n${body}`;
  }

  // 2. Replace the FAQ placeholder with REAL answers.
  body = replaceFaqPlaceholder(body, faq);

  // 3. Clean machine-like wording (protecting newlines).
  body = humanizeText(body);

  // 4. Links.
  const links = await injectLinks(project.id, body, research);

  // 5. Meta.
  const meta = {
    meta_title: brief.customTitle?.trim() || packaging.meta_title || h1,
    meta_description: packaging.meta_description || "",
    slug: packaging.slug || keyword.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60),
  };
  // Repeat versions get their own link: base, base-v2, base-v3...
  // (The first article keeps the clean slug.)
  const olderVersions = await db.query.contents.findMany({
    columns: { id: true },
    where: and(eq(contents.projectId, project.id), eq(contents.keywordId, keyword.id)),
  });
  if (olderVersions.length > 0) {
    meta.slug = `${meta.slug}-v${olderVersions.length + 1}`;
  }
  // 6. Validate (word count, density, readability, human-feel score...).
  const validation = validateContent(body, meta, keyword.keyword, brief.targetWords || 1200);

  // 7. Markdown -> clean HTML.
  const rawHtml = await marked(body);
  const bodyHtml = sanitizeHtml(rawHtml, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "p", "ul", "ol", "li",
      "table", "thead", "tbody", "tr", "th", "td",
      "a", "strong", "em", "blockquote", "code", "br", "hr",
    ],
    allowedAttributes: { a: ["href", "title", "rel"], th: ["scope"] },
  });

  const ymyl = /\b(loan|insurance|tax|medicine|medical|legal|investment|surgery|visa|crypto|child safety|health)\b/i.test(
    keyword.keyword
  );

  // 8. Save to the database.
  const [content] = await db
    .insert(contents)
    .values({
      projectId: project.id,
      briefId: brief.id,
      keywordId: keyword.id,
      title: h1,
      h1,
      slug: meta.slug,
      metaTitle: meta.meta_title,
      metaDescription: meta.meta_description,
      bodyHtml,
      bodyMarkdown: body,
      wordCount: validation.words,
      readabilityScore: validation.readability.flesch,
      keywordDensity: validation.keywordDensity,
      qualityScore: validation.qualityScore,
      faq: faq,
      schemaJson: buildSchemaJson(
        brief.contentType,
        meta,
        faq,
        getSiteUrl(),
        {
          siteType,
          projectName: project.name,
          city: project.targetCity,
          country: project.targetCountry,
          authorName: brandVoiceRow?.authorName || null,
          authorBio: brandVoiceRow?.authorBio || null,
        }
      ),
      sources: (research.top_results as unknown[]) || [],
      imagePrompts: packaging.image_prompts || [],
      internalLinks: links.internal,
      externalLinks: links.external,
      validationReport: {
        checks: validation.report,
        score: validation.qualityScore,
        humanScore: validation.humanScore,
        humanReport: validation.humanReport,
        archetype: outline._meta?.archetype || null,
        h2Count: validation.h2Count,
        h3Count: validation.h3Count,
        avgSentence: validation.avgSentence,
        keywordCount: validation.keywordCount,
        internalLinkSuggestions: packaging.internal_link_suggestions || [],
        tags: packaging.tags || [],
        category: packaging.category || "",
      },
      status: "draft",
      ymyl,
    })
    .returning();

  await db.update(briefs).set({ status: "complete" }).where(eq(briefs.id, brief.id));
  await db
    .update(generations)
    .set({ status: "completed", contentId: content.id })
    .where(eq(generations.id, generationId));
// Owner notification. Email must never break generation.
  try {
    const gen = await db.query.generations.findFirst({
      where: eq(generations.id, generationId),
      columns: { userId: true },
    });
    if (gen) {
      const owner = await db.query.users.findFirst({
        where: eq(users.id, gen.userId),
        columns: { name: true, email: true },
      });
      if (owner) {
        const base = getSiteUrl();
        const mail = articleReadyEmail(
          owner.name || "there",
          content.title || keyword.keyword,
          `${base}/contents/${content.id}`
        );
        await sendEmail(owner.email, mail.subject, mail.html, mail.text);
      }
    }
  } catch (mailError) {
    console.error("[article-ready:failed]", mailError);
  }
  return content.id;
}

// 4. STATE CHECK (to restore progress after a page refresh).

export async function getGenerationState(generationId: number, userId: number) {
  const gen = await db.query.generations.findFirst({ where: eq(generations.id, generationId) });
  if (!gen || gen.userId !== userId) throw new Error("Generation not found.");

  const briefRows = await db.query.briefs.findMany({
    where: eq(briefs.projectId, gen.projectId),
    orderBy: (b, { desc }) => [desc(b.id)],
    limit: 1,
  });
  const brief = (briefRows[0] || null) as BriefShape | null;

  const stage = (brief?.status || "research") as StageName;
  const outline = (brief?.outline || {}) as { _draft?: { written: unknown[] }; sections?: unknown[] };
  const writtenCount = outline._draft?.written?.length || 0;
  const sectionCount = outline.sections?.length || 0;
  const totalPieces = sectionCount ? sectionCount + 3 : 0;

  const stageIndex = STAGES.indexOf(stage);
  const done = gen.status === "completed";

  return {
    generationId: gen.id,
    status: gen.status,
    stage,
    stageLabel: STAGE_LABELS[stage] || stage,
    progress: done ? 100 : Math.round((stageIndex / STAGES.length) * 100),
    done,
    contentId: gen.contentId,
    errorMessage: gen.errorMessage,
    wordsSoFar: 0,
    piecesWritten: writtenCount,
    totalPieces,
    model: gen.modelName,
    tokensIn: gen.tokensIn,
    tokensOut: gen.tokensOut,
    apiCostUsd: gen.apiCostUsd,
    durationMs: gen.durationMs,
    stageTimings: gen.stageTimings,
  };
}

export { countWords };
