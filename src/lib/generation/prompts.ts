// Prompt builders for every generation stage.
// Each prompt has three parts: ROLE (who the AI is),
// RULES (what to do and what never to do),
// SCHEMA (the exact JSON shape to return, with an example).

export interface ProjectContext {
  keyword: string;
  customTitle?: string | null;
  siteType?: "local" | "global" | null;
  country: string;
  city?: string | null;
  language?: string | null;
  industry?: string | null;
  audience?: string | null;
  businessDescription?: string | null;
  productsServices?: string | null;
  competitors?: string | null;
  contentType: string;
  targetWords: number;
  tone: string;
  secondaryKeywords: string[];
  extraInstructions?: string | null;
  mode?: "ai" | "humanized";
  generationSeed?: number;
  versionNumber?: number;
  archetype?: { id: string; name: string; description: string; structure: string };
  selectedBlocks?: string[];
  randomTextures?: string[];
  brandVoice?: {
    tone?: string | null;
    readingLevel?: string | null;
    mustUseWords?: unknown;
    bannedWords?: unknown;
    authorName?: string | null;
    authorBio?: string | null;
    sampleWriting?: string | null;
  } | null;
}

// BANNED AI PHRASES list (~40): Stiff robotic clichés forbidden across all content.
export const BANNED_AI_PHRASES = [
  "delve",
  "delve into",
  "dive into",
  "dive in",
  "embark",
  "tapestry",
  "game-changer",
  "game changer",
  "in today's fast-paced world",
  "in today's digital age",
  "in today's digital landscape",
  "in today's world",
  "it is important to note",
  "it's important to note",
  "it is worth noting",
  "it's worth noting",
  "furthermore",
  "moreover",
  "additionally",
  "in conclusion",
  "in summary",
  "overall,",
  "navigate the landscape",
  "unlock the potential",
  "unlock",
  "in the realm of",
  "testament to",
  "when it comes to",
  "boasts",
  "bustling",
  "vibrant",
  "nestled",
  "elevate",
  "seamless",
  "seamlessly",
  "cutting-edge",
  "cutting edge",
  "leverage",
  "utilize",
  "plethora",
  "myriad",
  "comprehensive guide",
  "ultimate guide",
  "whether you're a",
  "look no further",
  "revolutionize",
  "beacon",
  "pinnacle",
  "paramount",
] as const;

// ARCHETYPE POOL PER CONTENT TYPE (guarantees diverse outline frameworks every run)
export const ARCHETYPE_POOLS: Record<
  string,
  Array<{ id: string; name: string; description: string; structure: string }>
> = {
  blog_post: [
    {
      id: "listicle",
      name: "Curated Numbered Strategies",
      description: "Numbered actionable breakdown with real-world commentary and benchmarks",
      structure: "Core takeaways -> Strategy 1..N with real examples -> Common pitfalls -> Execution roadmap",
    },
    {
      id: "myth_vs_fact",
      name: "Myth vs. Reality Teardown",
      description: "Busting 4-6 costly misconceptions with benchmarks and verified data",
      structure: "The prevailing misconception -> Why it fails in practice -> Real benchmark data -> What actually works",
    },
    {
      id: "step_by_step",
      name: "End-to-End Action Blueprint",
      description: "Sequential implementation path from initial assessment to final verification",
      structure: "Pre-requisites -> Phase 1 to Phase N -> Quality check -> Troubleshooting & next steps",
    },
    {
      id: "cost_breakdown",
      name: "Complete Cost & Pricing Economics",
      description: "Line-item budgeting, price factors, ROI calculator & hidden cost traps",
      structure: "Estimated budget table -> Core cost drivers -> Hidden fees to avoid -> Cost reduction tactics",
    },
    {
      id: "mistakes_to_avoid",
      name: "Costly Mistakes & Proven Fixes",
      description: "Real-world errors people make, consequences, and how to avoid them",
      structure: "Mistake breakdown -> Real-world impact -> The correct solution -> Action checklist",
    },
    {
      id: "beginner_guide",
      name: "Zero-Jargon Fundamentals",
      description: "Accessible beginner guide establishing concepts, basics and fast wins",
      structure: "Core definition -> Why it matters now -> Fundamental building blocks -> Getting started today",
    },
    {
      id: "comparison",
      name: "Head-to-Head Evaluation & Verdict",
      description: "Unbiased criteria-based comparison with a definitive decision matrix",
      structure: "Comparison criteria -> Option A vs B breakdown -> Feature/Cost matrix -> Final recommendation",
    },
    {
      id: "case_study_driven",
      name: "Scenario-Driven Deep Dive",
      description: "Framework illustrated through concrete real-world client scenarios",
      structure: "The challenge scenario -> Diagnosing the root issue -> Implementation -> Measured outcome",
    },
  ],
  article: [
    {
      id: "hub_spoke",
      name: "Authoritative Master Pillar",
      description: "Exhaustive category-defining guide mapping the entire landscape",
      structure: "Landscape overview -> Core pillars 1..N -> Decision matrix -> 2026-2027 future trends",
    },
    {
      id: "stats_driven",
      name: "Data & Benchmark Industry Report",
      description: "Statistics-heavy analysis exploring trends, costs, and market shift",
      structure: "Executive summary -> Benchmark findings -> Data interpretations -> Practical action plan",
    },
    {
      id: "expert_qa",
      name: "Expert Practitioner Deep-Dive",
      description: "In-depth answers to the 6 most challenging questions buyers and operators face",
      structure: "Industry context -> Crucial Question 1..N -> Decision criteria -> Expert checklist",
    },
    {
      id: "timeline",
      name: "Evolution, Current State & 2026-2027 Outlook",
      description: "Historical context, current state-of-the-art, and upcoming shifts",
      structure: "Past limitations -> Modern state of the art -> Upcoming 2026-2027 shifts -> Preparation steps",
    },
  ],
  landing_page: [
    {
      id: "promise_proof_steps_objections_cta",
      name: "High-Converting Conversion Framework",
      description: "Clear value promise, evidence/proof, simple process, objection buster, and CTA",
      structure: "Hero promise -> Social proof & numbers -> 3-step process -> Overcoming objections -> Final CTA",
    },
  ],
  service_page: [
    {
      id: "what_who_process_pricing_areas_faq",
      name: "Full-Funnel Local Service Blueprint",
      description: "Scope of work, ideal client criteria, step-by-step process, pricing, local coverage, FAQs",
      structure: "Service overview -> Who this is for -> Step-by-step execution -> Transparent pricing -> Service areas -> FAQs",
    },
  ],
  faq_page: [
    {
      id: "clustered_quick_answers_deep_dives",
      name: "Clustered Knowledge Center",
      description: "Category-grouped direct answers backed by expert elaboration",
      structure: "Category 1 quick answers -> Category 2 technical answers -> Pricing & timeline answers -> Decision guide",
    },
  ],
};

// Available building blocks for section variety
export const BUILDING_BLOCKS = [
  "table",
  "numbered_steps",
  "bullets",
  "pros_cons",
  "callout_quote",
  "checklist",
  "key_takeaways_box",
] as const;

// Shared: brand voice + project detail, included in every prompt.
function brandBlock(ctx: ProjectContext): string {
  const bv = ctx.brandVoice;
  const lines: string[] = [];

  // Website Type & Geography Nuance (Part 3)
  if (ctx.siteType === "local" && ctx.city) {
    lines.push(
      `WEBSITE TYPE: Local Business (City: ${ctx.city}). Important: The article MUST address local search intent for ${ctx.city}. Naturally incorporate "${ctx.city}" in headings, localized service context, climate/location nuances (such as monsoon or local seasonal wear), local pricing norms, and "near me" service intent.`
    );
  } else if (ctx.siteType === "global") {
    lines.push(
      `WEBSITE TYPE: Global / National Website. Important: Target a universal, worldwide audience. Do NOT restrict advice to any specific city or local geography. Focus on global standards, scalability, and broad applicability.`
    );
  } else if (ctx.city) {
    lines.push(`Target city: ${ctx.city}`);
  }

  if (ctx.industry) lines.push(`Industry: ${ctx.industry}`);
  if (ctx.audience) lines.push(`Target audience: ${ctx.audience}`);
  lines.push(`Target country: ${ctx.country}`);
  lines.push(`Language: ${ctx.language === "hi" ? "Hindi" : "English"}`);
  if (ctx.businessDescription) {
    lines.push(`Business description: ${ctx.businessDescription.slice(0, 900)}`);
  }
  if (ctx.productsServices) {
    lines.push(`Products/Services: ${String(ctx.productsServices).slice(0, 600)}`);
  }

  // E-E-A-T author details (Part 4)
  if (bv?.authorName) lines.push(`Author name (E-E-A-T): ${bv.authorName}`);
  if (bv?.authorBio) lines.push(`Author bio (E-E-A-T): ${bv.authorBio.slice(0, 400)}`);
  if (bv?.tone) lines.push(`Brand tone: ${bv.tone}`);
  if (bv?.readingLevel) lines.push(`Reading level: ${bv.readingLevel}`);

  const must = (bv?.mustUseWords as string[]) || [];
  if (must.length) lines.push(`Words that MUST appear: ${must.slice(0, 15).join(", ")}`);

  const banned = (bv?.bannedWords as string[]) || [];
  if (banned.length) lines.push(`Words that must NEVER appear: ${banned.slice(0, 20).join(", ")}`);

  if (bv?.sampleWriting) {
    lines.push(
      `STYLE SAMPLE — imitate this voice, rhythm and sentence length in everything you write (do NOT copy its topic or facts):\n${bv.sampleWriting.slice(0, 1200)}`
    );
  }

  return lines.join("\n");
}

function extraBlock(ctx: ProjectContext): string {
  if (!ctx.extraInstructions) return "";
  return `EXTRA INSTRUCTIONS (follow these strictly):\n${ctx.extraInstructions}`;
}

function secondaryKeywordsBlock(ctx: ProjectContext): string {
  if (!ctx.secondaryKeywords || ctx.secondaryKeywords.length === 0) return "";
  const list = ctx.secondaryKeywords.map((k) => k.trim()).filter(Boolean);
  if (list.length === 0) return "";
  return `SECONDARY KEYWORDS (weave these into the content naturally where relevant, preserving exact multi-word spacing such as "seo content writer", never collapse words together without spaces):\n${list.map((k) => `- ${k}`).join("\n")}`;
}

// Shared: Rules that keep the writing human-sounding (Part 1.A)
export const HUMAN_WRITING_RULES = `
WRITING RULES (strict human voice enforcement):
1. ANSWER-FIRST: Every section MUST give the direct, actionable answer or insight in its very first 1-2 sentences. Never make the reader wait through background fluff.
2. NATURAL HUMAN CONTRACTIONS: Always use natural contractions ("don't", "we're", "isn't", "you'll", "that's", "can't", "won't"). Stiff uncontracted English sounds robotic.
3. FIRST-PERSON LIVED EXPERIENCE: Include 2-3 natural lines throughout the article demonstrating first-hand experience (e.g. "In our client projects, we frequently see...", "When we tested this across...", "From what we've seen on the ground...").
4. SENTENCE RHYTHM & BURSTINESS: Vary sentence length dynamically. Mix 4-7 word punchy sentences with 15-20 word detailed ones. Never write three sentences of the same length in a row. Occasionally start sentences with "And" or "But".
5. BANNED AI PHRASES (Never use any of these):
"delve", "delve into", "dive into", "dive in", "embark", "tapestry", "game-changer", "in today's fast-paced world", "in today's digital age", "in today's digital landscape", "in today's world", "it's important to note", "it is important to note", "it's worth noting", "furthermore", "moreover", "additionally", "in conclusion", "in summary", "overall,", "navigate the landscape", "unlock", "unlock the potential", "in the realm of", "testament to", "when it comes to", "boasts", "bustling", "vibrant", "nestled", "elevate", "seamless", "seamlessly", "cutting-edge", "leverage", "utilize", "plethora", "myriad", "comprehensive guide", "ultimate guide", "whether you're a", "look no further", "revolutionize", "beacon", "pinnacle", "paramount".
6. EM-DASH LIMIT & ZERO EMOJIS: Maximum 2 em-dashes ("—") across the entire article. ZERO emojis in the article body.
7. NO THROAT-CLEARING OPENINGS: Never write "In this article, we will...", "This guide explores...", or "Welcome to...". Start directly with a concrete tension, problem, realistic scenario, or verified metric.
8. SINGLE H1: Exactly one H1 in the article. Keep all other sections as H2 (##) or H3 (###).
9. NO IN-PARAGRAPH BOLDING: Bold text only inside table headers or a specific term being formally defined.
10. CONCRETE NUMBERS: Prefer realistic numbers, price ranges, timeframes and examples over vague generic adjectives.
11. KEYWORD DENSITY: Natural placement (0.5% to 1.8%). Never repeat the primary keyword unnaturally.`;

// Humanized mode: extra rules that make output read fully human (Part 1.A)
export const HUMANIZED_MODE_RULES = `
HUMANIZED MODE (zero AI-footprint):
1. First-person voice ("we", "you") — speak like a veteran colleague over coffee, not a distant report.
2. Real-world texture: Quote a realistic metric, price range, timeframe, or "what happened when we tried X" in every major section.
3. Sentence fragments are welcome. Like this.
4. Direct questions to the reader: Ask 2-3 rhetorical or decision-making questions throughout the piece and answer them immediately.
5. High burstiness: Keep at least one sentence under 8 words in every paragraph.
6. End sections with a practical tip, warning, or next step — never a generic summary sentence.`;

// STAGE 2 — RESEARCH

export function researchPrompt(ctx: ProjectContext) {
  const system = `You are a senior SEO research analyst with 12 years of experience. You analyse search intent, competitor coverage, real Google SERP questions, and content gaps before any article is written.

${HUMAN_WRITING_RULES}

YOUR OUTPUT MUST BE VALID JSON. No text before or after the JSON. No markdown code fences.
Every string value must be plain text (no markdown, no bullet characters inside strings).`;

  const user = `Research the keyword: "${ctx.keyword}"

${brandBlock(ctx)}

Return JSON with EXACTLY this shape:

{
  "search_intent": "one of: informational | commercial | transactional | navigational",
  "intent_summary": "2-3 sentences: what exactly does this searcher want to get from this page? Write it in plain English.",
  "reader_profile": "1 sentence describing who this person is and what they already know.",
  "top_results": [
    { "rank": 1, "title": "a realistic page title that would rank", "url": "https://example.com/page", "angle": "what angle this page takes" }
  ],
  "people_also_ask": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "related_searches": ["term 1", "term 2", "term 3", "term 4", "term 5"],
  "facts": [
    { "statement": "a specific, checkable fact or benchmark relevant to this topic", "why_it_matters": "why the reader cares" }
  ],
  "statistics": [
    { "metric": "name of the metric", "value": "number or range with unit", "context": "what it means", "source": "who publishes this number (site or report name), or 'industry estimate' — if neither is possible, drop the stat" }
  ],
  "definitions": [
    { "term": "a term the reader may not know", "plain_english": "explain it in under 15 words" }
  ],
  "content_gaps": ["what top-ranking pages FAIL to explain — this is where we win"],
  "common_mistakes": ["mistake buyers or readers commonly make"],
  "buying_criteria": ["what the reader should compare before choosing"],
  "local_facts": ["anything specific to ${ctx.city || ctx.country} — regulations, pricing norms, market habits"],
  "risks": ["what could go wrong if the reader chooses badly"],
  "freshness_note": "what is changing in this topic during 2026-2027"
}

REQUIREMENTS:
- top_results: exactly 5 items. Use REAL-SOUNDING titles and plausible URLs for this industry.
- people_also_ask: exactly 5 questions — these will be wired directly into the FAQ section. Write them the way a real person types them into Google.
- facts: at least 6 items. Be specific (numbers, ranges, timeframes). If unsure, give a realistic industry range.
- statistics: at least 4 items. Every stat needs a source or clear industry estimate.
- definitions: 3 to 5 items.
- content_gaps: at least 4 items.
- local_facts: at least 2 items if a city/country is given, else return [].

Keyword: "${ctx.keyword}"`;

  return { system, user };
}

// STAGE 3 — OUTLINE (Parts 2 & 4: Archetype + Building Blocks + Google Guidelines)

export function outlinePrompt(ctx: ProjectContext, research: Record<string, unknown>) {
  const system = `You are a principal content strategist. You turn research into a unique, non-formulaic article outline that perfectly matches Google search guidelines.

${HUMAN_WRITING_RULES}

YOUR OUTPUT MUST BE VALID JSON. No text before or after. No code fences.`;

  const titleInstruction = ctx.customTitle?.trim()
    ? `USER'S SPECIFIED TITLE: "${ctx.customTitle.trim()}". You MUST use this exact title as the "h1" value in the JSON response without alteration.`
    : `TITLE INSTRUCTION: Create a real, unique, high-ranking H1 title that includes the primary keyword "${ctx.keyword}". Must be under 65 characters and avoid typical cliché AI title patterns.`;

  // Archetype & Building block guidance (Part 2)
  const archetypeInfo = ctx.archetype
    ? `OUTLINE ARCHETYPE: "${ctx.archetype.name}" (${ctx.archetype.description})
Recommended structural flow: ${ctx.archetype.structure}.
Follow this archetype's narrative logic so this article feels distinctly unique compared to generic guides.`
    : "";

  const assignedBlocks = (ctx.selectedBlocks || ["table", "bullets", "callout_quote"]).join(", ");
  const buildingBlocksGuidance = `BUILDING BLOCKS ROTATION:
This article should rotate through these visual elements across sections: [${assignedBlocks}].
Rules:
- Assign at least 2 different building blocks across different sections.
- Use a markdown "table" ONLY in a section that discusses costs, pricing, comparisons, or feature matrices.
- Do NOT use the same building block in two consecutive sections.
- Specify the intended block for each section in the "block_type" field (e.g. "table", "numbered_steps", "bullets", "pros_cons", "callout_quote", "checklist", "none").`;

  // PAA wiring (Part 4)
  const paaQuestions = (research.people_also_ask as string[]) || [];
  const paaInstruction =
    paaQuestions.length > 0
      ? `GOOGLE PEOPLE ALSO ASK (PAA) WIRING:
Google ranks FAQ schema that matches real search intent. You MUST include 3 to 5 of these real Google People Also Ask queries in the "faq_questions" array:
${paaQuestions.slice(0, 5).map((q) => `- ${q}`).join("\n")}`
      : `FAQ WIRING: Include 5 sharp questions searchers frequently ask about ${ctx.keyword}.`;

  const user = `Build a detailed outline for a ${ctx.contentType} about "${ctx.keyword}".

${brandBlock(ctx)}

${titleInstruction}

${archetypeInfo}

${buildingBlocksGuidance}

${secondaryKeywordsBlock(ctx)}

TARGET LENGTH: ${ctx.targetWords} words. Split that across the sections below
(each section's target_words must add up to roughly ${ctx.targetWords}).

RESEARCH WE ALREADY HAVE (use it — do not invent a different topic):
${JSON.stringify(research).slice(0, 4000)}

${paaInstruction}

Return JSON with EXACTLY this shape:

{
  "h1": ${ctx.customTitle?.trim() ? JSON.stringify(ctx.customTitle.trim()) : '"the H1 title — must contain the primary keyword, under 65 characters"'},
  "angle": "one sentence: the unique angle this article takes that competitors do not",
  "sections": [
    {
      "heading": "H2 heading in sentence case",
      "level": 2,
      "target_words": 250,
      "block_type": "one of: table | numbered_steps | bullets | pros_cons | callout_quote | checklist | none",
      "purpose": "what this section must achieve for the reader (answer-first)",
      "key_points": ["specific point to cover", "another point"],
      "use_research": ["which research item feeds this section"]
    }
  ],
  "faq_questions": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "closing_cta": "what the reader should do at the end (specific to this business)",
  "total_target_words": ${ctx.targetWords}
}

REQUIREMENTS:
- sections: between 5 and 8 items. Order them according to the archetype.
- Each section must have 3 to 5 key_points.
- Every section heading must be punchy and specific — NEVER use generic heads like "Overview", "Introduction", "Conclusion", "Why It Matters" alone.
- At least 2 sections must directly attack the "content_gaps" from the research.
- faq_questions: exactly 5 items, WIRE IN REAL PAA QUESTIONS from the list above.
- Never add an "Introduction" or "Conclusion" section as plain headings — opening and closing are handled separately.`;

  return { system, user };
}

// STAGE 4 — WRITER (Sections with answer-first, building blocks & random texture)

export function writerSectionPrompt(
  ctx: ProjectContext,
  research: Record<string, unknown>,
  outline: { h1?: string; angle?: string },
  section: {
    heading: string;
    target_words: number;
    purpose?: string;
    key_points?: string[];
    use_research?: string[];
    blockType?: string;
  },
  sectionIndex: number,
  totalSections: number,
  previousHeads: string[],
  sectionTexture?: string
) {
  const system = `You are a senior writer for a respected trade publication. You have 12 years of hands-on experience and write like an authentic human practitioner, never like an AI content generator.

${HUMAN_WRITING_RULES}

OUTPUT FORMAT:
- ${ctx.mode === "humanized" ? HUMANIZED_MODE_RULES : ""}
Return MARKDOWN only. No preamble like "Here is the section".
- Start directly with the "## " heading given to you. Use the EXACT heading text you are given.
- ANSWER-FIRST: The very first 1-2 sentences under the heading MUST give the direct answer or core practical takeaway.
- Use "### " for sub-points inside the section when it helps.
- Do NOT write the article title (H1) — only this section.
- Do NOT add any closing summary like "In conclusion".
- Length: within 15% of the target word count (${section.target_words} words).`;

  const blockInstruction =
    section.blockType === "table"
      ? `VISUAL ELEMENT: Include a clean markdown table in this section comparing costs, options, specifications, or benchmarks.`
      : section.blockType === "numbered_steps"
      ? `VISUAL ELEMENT: Include a sequence of numbered steps (1., 2., 3.) for the implementation part of this section.`
      : section.blockType === "pros_cons"
      ? `VISUAL ELEMENT: Include a clear Pros and Cons breakdown using bullet lists.`
      : section.blockType === "callout_quote"
      ? `VISUAL ELEMENT: Include a blockquote ("> **Expert Tip:** ...") offering a high-value cautionary insight or field observation.`
      : section.blockType === "checklist"
      ? `VISUAL ELEMENT: Include an actionable checklist of items the reader can verify immediately.`
      : "";

  const textureInstruction = sectionTexture
    ? `SPECIFIC SECTION CONSTRAINT (follow this):\n${sectionTexture}`
    : "";

  const user = `ARTICLE
Primary keyword: ${ctx.keyword}
Title (H1): ${outline.h1 || ctx.keyword}
Overall angle: ${outline.angle || "practical, experience-based guide"}
Content type: ${ctx.contentType}
Tone: ${ctx.tone}

${brandBlock(ctx)}

${secondaryKeywordsBlock(ctx)}

SECTION ${sectionIndex + 1} OF ${totalSections}
Heading to use: ## ${section.heading}
Target length: about ${section.target_words} words
Purpose of this section: ${section.purpose || "inform and help the reader decide"}
Points that MUST be covered:
${(section.key_points || []).map((p) => `- ${p}`).join("\n") || "- decide sensible points yourself"}

${blockInstruction}

${textureInstruction}

RESEARCH TO USE (pick only what fits this section):
${JSON.stringify({
  facts: (research.facts as unknown[])?.slice(0, 5),
  statistics: (research.statistics as unknown[])?.slice(0, 4),
  definitions: (research.definitions as unknown[])?.slice(0, 3),
  common_mistakes: (research.common_mistakes as unknown[])?.slice(0, 3),
  buying_criteria: (research.buying_criteria as unknown[])?.slice(0, 3),
  local_facts: (research.local_facts as unknown[])?.slice(0, 3),
  risks: (research.risks as unknown[])?.slice(0, 2),
}).slice(0, 2500)}

SECTIONS ALREADY WRITTEN (do not repeat their content or their headings):
${previousHeads.length ? previousHeads.map((h) => `- ${h}`).join("\n") : "- (this is the first section)"}

${extraBlock(ctx)}

Now write ONLY this section. Start with "## ${section.heading}". Answer-first in sentence 1.`;

  return { system, user };
}

export function writerOpeningPrompt(
  ctx: ProjectContext,
  research: Record<string, unknown>,
  outline: { h1?: string; angle?: string },
  firstSectionHeading: string
) {
  const system = `You are a senior writer who hooks readers immediately with authentic human insight.

${HUMAN_WRITING_RULES}

OUTPUT FORMAT:
- Markdown only. No preamble, no title, no H1.
- ${ctx.mode === "humanized" ? HUMANIZED_MODE_RULES : ""}
2 to 4 short paragraphs. Total 90-150 words.
- ANSWER-FIRST: Within the first 100 words, clearly answer the searcher's core question or state the main solution.
- NEVER start with "In today's world", "In this article", "Whether you're...", or a dictionary definition.
- Start directly with a concrete tension, problem, realistic scenario, or verified benchmark.
- End with one sentence that transitions smoothly into "${firstSectionHeading}".`;

  const authorByline = ctx.brandVoice?.authorName
    ? `*By ${ctx.brandVoice.authorName}${ctx.brandVoice.authorBio ? ` — ${ctx.brandVoice.authorBio.slice(0, 100)}` : ""}*`
    : "";

  const user = `Write the opening (intro) for this article.

Primary keyword: ${ctx.keyword}
Title (H1): ${outline.h1 || ctx.keyword}
Angle: ${outline.angle || "practical, experience-based guide"}
Audience: ${ctx.audience || "business decision makers"}
Tone: ${ctx.tone}

${brandBlock(ctx)}

${authorByline ? `Include this author byline at the very start as italic text:\n${authorByline}\n` : ""}

${secondaryKeywordsBlock(ctx)}

The next section heading will be: "${firstSectionHeading}"
Lead naturally into it.

Key research:
${JSON.stringify({
  intent_summary: research.intent_summary,
  statistics: (research.statistics as unknown[])?.slice(0, 3),
  common_mistakes: (research.common_mistakes as unknown[])?.slice(0, 2),
  local_facts: (research.local_facts as unknown[])?.slice(0, 2),
}).slice(0, 1500)}

${extraBlock(ctx)}
Write the opening now. Answer-first.`;

  return { system, user };
}

export function writerClosingPrompt(
  ctx: ProjectContext,
  outline: { h1?: string; closing_cta?: string },
  sectionHeads: string[]
) {
  const system = `You are a senior writer. You write closings that feel like advice from a trusted colleague, not a generic robot summary.

${HUMAN_WRITING_RULES}

OUTPUT FORMAT:
- Markdown only. No preamble.
- ${ctx.mode === "humanized" ? HUMANIZED_MODE_RULES : ""}
Start with "## " and an engaging, decision-focused heading (never "Conclusion", "Final Thoughts" alone, or "Summary").
- 2 to 3 short paragraphs giving a clear decision framework or immediate next step.
- Optionally 3-4 bullet points of "what to do next".
- End with a natural, persuasive call to action.`;

  const user = `Write the closing section of this article.

Primary keyword: ${ctx.keyword}
Title (H1): ${outline.h1 || ctx.keyword}
Suggested action for the reader: ${outline.closing_cta || "contact the business for a consultation"}

${brandBlock(ctx)}

${secondaryKeywordsBlock(ctx)}

Sections already written:
${sectionHeads.map((h) => `- ${h}`).join("\n")}

${extraBlock(ctx)}
Write the closing now.`;

  return { system, user };
}

// HUMAN EDITOR PASS (Part 1.B — Polishing robotic lines, breaking rhythm, zeroing clichés)

export function humanEditorPrompt(
  ctx: ProjectContext,
  fullDraft: string
) {
  const system = `You are a Senior Chief Editor at a major trade publication with 20 years of experience.
Your job is to perform a rigorous human editorial pass on an article draft.

YOUR OBJECTIVES:
1. ROBOTIC RHYTHM BREAK: If you notice uniform sentence lengths or robotic paragraph patterns, break them up. Add short fragments, combine sentences, or add natural cadence.
2. ELIMINATE ANY REMAINING AI PHRASES: Wipe out any words like "delve", "leverage", "seamless", "tapestry", "game-changer", "it's important to note", "moreover", "furthermore", "testament", "elevate", "unlock", "pinnacle".
3. ADD 1-2 REALISTIC HUMAN TOUCHES: Naturally weave in 1-2 conversational practitioner remarks (e.g. "We've seen this fail when...", "The practical catch here is...", "In our experience...").
4. STRICT RULES:
   - DO NOT alter facts, numbers, statistics, or real examples.
   - DO NOT delete sections or change the heading hierarchy (##, ###).
   - Max 2 em-dashes ("—") across the entire article.
   - ZERO emojis.
   - Preserve all markdown tables and lists.

OUTPUT FORMAT:
Return ONLY the edited, polished MARKDOWN text. No preamble, no editor comments.`;

  const user = `Here is the full article draft for "${ctx.keyword}".
${brandBlock(ctx)}

DRAFT TO EDIT:
${fullDraft}

Perform the chief human editor pass now. Return only the revised markdown:`;

  return { system, user };
}

// STAGE 5 — PACKAGING (Meta tags, FAQ with real PAA answers, Image prompts)

export function packagingPrompt(
  ctx: ProjectContext,
  research: Record<string, unknown>,
  outline: { h1?: string; faq_questions?: string[] },
  article: string
) {
  const system = `You are an SEO director who prepares a finished article for publishing. You write meta tags, FAQ answers and image briefs that conform to Google Search guidelines.

${HUMAN_WRITING_RULES}

YOUR OUTPUT MUST BE VALID JSON. No text before or after. No code fences.`;

  const paaQuestions = (research.people_also_ask as string[]) || [];

  const user = `Prepare the publishing package for this article.

Primary keyword: "${ctx.keyword}"
Content type: ${ctx.contentType}

${brandBlock(ctx)}

${secondaryKeywordsBlock(ctx)}

ARTICLE TITLE: ${outline.h1 || ctx.keyword}

Questions that need real answers (these become the FAQ section — prioritize real Google PAA queries):
${(outline.faq_questions || paaQuestions.slice(0, 5)).map((q) => `- ${q}`).join("\n") || "- decide 5 sensible questions yourself"}

ARTICLE (for context — answer the FAQ using details from this text):
${article.slice(0, 9000)}

Return JSON with EXACTLY this shape:

{
  "meta_title": "30 to 65 characters. Contains the primary keyword naturally. NO clickbait.",
  "meta_description": "120 to 165 characters. Mentions a concrete benefit AND a concrete detail (number, timeframe or city).",
  "slug": "lowercase-words-with-hyphens, max 5 words, no stop words",
  "h1": "the final H1 (max 65 chars)",
  "tags": ["3 to 6 short topical tags"],
  "category": "single category name from the industry",
  "faq": [
    {
      "question": "the exact question text",
      "answer": "40 to 80 words. A REAL direct answer that a human would accept. Use a specific number or detail from the article. Never write 'it depends' without immediately saying what it depends on."
    }
  ],
  "image_prompts": [
    {
      "placement": "after the intro | mid-article | near the pricing table",
      "prompt": "a detailed text-to-image prompt showing ONLY something explicitly mentioned in THIS article. Name setting, subject, lighting, angle, mood. No text in image. FORBIDDEN: generic offices, handshakes, rockets, robots.",
      "negative_prompt": "what to avoid",
      "alt_text": "SEO alt text under 125 characters describing the image",
      "file_name": "keyword-based-name.webp",
      "caption": "a one-line caption for the image"
    }
  ],
  "internal_link_suggestions": [
    { "anchor_text": "natural phrase from the article", "suggested_target_topic": "what kind of page it should link to" }
  ]
}

REQUIREMENTS:
- faq: EXACTLY one answer for EVERY question listed above. Provide direct answers in 40-75 words.
- image_prompts: exactly 3 items.
- meta_title: 30-65 chars.
- meta_description: 120-165 chars.
- internal_link_suggestions: 3 to 5 items.

Keyword: "${ctx.keyword}"`;

  return { system, user };
}

// Helper: extract JSON from an AI reply.
export function safeJsonParse<T>(text: string, fallback: T): T {
  if (!text) return fallback;

  try {
    return JSON.parse(text) as T;
  } catch {
    // Continue
  }

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {
      // Continue
    }
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1)) as T;
    } catch {
      // Continue
    }
  }

  console.error("JSON parse failed. AI reply was:\n", text.slice(0, 600));
  return fallback;
}
