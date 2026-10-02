import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  real,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const userPlanEnum = pgEnum("user_plan", ["free", "starter", "pro", "agency"]);
export const keywordStatusEnum = pgEnum("keyword_status", ["new", "in_progress", "done", "skipped"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "approved", "exported", "published"]);
export const generationStatusEnum = pgEnum("generation_status", ["queued", "running", "completed", "failed", "refunded"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "failed", "refunded"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    credits: integer("credits").default(0).notNull(),
    plan: userPlanEnum("plan").default("free").notNull(),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    gstin: varchar("gstin", { length: 50 }),
    phone: varchar("phone", { length: 50 }),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    timezone: varchar("timezone", { length: 100 }).default("Asia/Kolkata"),
    ...timestamps,
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    websiteUrl: varchar("website_url", { length: 500 }).notNull(),
    businessDescription: text("business_description").notNull(),
    industry: varchar("industry", { length: 255 }),
    targetCity: varchar("target_city", { length: 255 }),
    targetCountry: varchar("target_country", { length: 100 }).default("IN"),
    audience: text("audience"),
    productsServices: text("products_services"),
    competitors: text("competitors"),
    language: varchar("language", { length: 10 }).default("en"),
    status: varchar("status", { length: 50 }).default("active"),
    settings: jsonb("settings").default({}),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("projects_user_idx").on(table.userId),
  })
);

export const sources = pgTable(
  "sources",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    filePath: varchar("file_path", { length: 1000 }).notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(),
    rowCount: integer("row_count").default(0),
    parseReport: jsonb("parse_report").default({}),
    uploadedBy: integer("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    projectIdx: index("sources_project_idx").on(table.projectId),
  })
);

export const clusters = pgTable(
  "clusters",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    keywordCount: integer("keyword_count").default(0),
    summary: text("summary"),
    ...timestamps,
  },
  (table) => ({
    projectIdx: index("clusters_project_idx").on(table.projectId),
  })
);

export const keywords = pgTable(
  "keywords",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sourceId: integer("source_id").references(() => sources.id, { onDelete: "set null" }),
    keyword: text("keyword").notNull(),
    normalizedKeyword: text("normalized_keyword").notNull(),
    volume: integer("volume"),
    difficulty: integer("difficulty"),
    intent: varchar("intent", { length: 50 }),
    clusterId: integer("cluster_id").references(() => clusters.id, { onDelete: "set null" }),
    isMain: boolean("is_main").default(false),
    secondaryOf: integer("secondary_of"),
    language: varchar("language", { length: 10 }),
    city: varchar("city", { length: 255 }),
    notes: text("notes"),
    status: keywordStatusEnum("status").default("new").notNull(),
    usedInContentId: integer("used_in_content_id"),
    priority: integer("priority").default(0),
    slugGuess: varchar("slug_guess", { length: 500 }),
    ...timestamps,
  },
  (table) => ({
    projectIdx: index("keywords_project_idx").on(table.projectId),
    clusterIdx: index("keywords_cluster_idx").on(table.clusterId),
    normalizedIdx: index("keywords_normalized_idx").on(table.normalizedKeyword),
    statusIdx: index("keywords_status_idx").on(table.status),
  })
);

export const linkLibrary = pgTable(
  "link_library",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 2000 }).notNull(),
    slug: varchar("slug", { length: 500 }),
    pageTitle: varchar("page_title", { length: 500 }),
    h1: text("h1"),
    metaDescription: text("meta_description"),
    topicTags: jsonb("topic_tags").default([]),
    anchorOptions: jsonb("anchor_options").default([]),
    httpStatus: integer("http_status"),
    wordCount: integer("word_count"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    isActive: boolean("is_active").default(true),
    ...timestamps,
  },
  (table) => ({
    projectIdx: index("link_library_project_idx").on(table.projectId),
  })
);

export const brandVoices = pgTable(
  "brand_voices",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" })
      .unique(),
    tone: varchar("tone", { length: 100 }).default("simple English"),
    mustUseWords: jsonb("must_use_words").default([]),
    bannedWords: jsonb("banned_words").default([]),
    authorName: varchar("author_name", { length: 255 }),
    authorBio: text("author_bio"),
    authorCredentials: text("author_credentials"),
    sampleWriting: text("sample_writing"),
    readingLevel: varchar("reading_level", { length: 50 }).default("Grade 7"),
    forbiddenTopics: jsonb("forbidden_topics").default([]),
    uniqueExperienceFacts: jsonb("unique_experience_facts").default([]),
    standardCta: text("standard_cta"),
    disclaimers: jsonb("disclaimers").default([]),
    ...timestamps,
  },
  (table) => ({
    projectIdx: index("brand_voices_project_idx").on(table.projectId),
  })
);

export const briefs = pgTable(
  "briefs",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    keywordId: integer("keyword_id")
      .notNull()
      .references(() => keywords.id, { onDelete: "cascade" }),
    customTitle: text("custom_title"),
    contentType: varchar("content_type", { length: 100 }).notNull(),
    audience: text("audience"),
    secondaryKeywords: jsonb("secondary_keywords").default([]),
    targetWords: integer("target_words").default(1200),
    tone: varchar("tone", { length: 100 }),
    extraInstructions: text("extra_instructions"),
    researchData: jsonb("research_data").default({}),
    outline: jsonb("outline").default({}),
    status: varchar("status", { length: 50 }).default("draft"),
    needsFacts: boolean("needs_facts").default(false),
    ...timestamps,
  },
  (table) => ({
    projectIdx: index("briefs_project_idx").on(table.projectId),
    keywordIdx: index("briefs_keyword_idx").on(table.keywordId),
  })
);

export const contents = pgTable(
  "contents",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    briefId: integer("brief_id").references(() => briefs.id, { onDelete: "set null" }),
    keywordId: integer("keyword_id")
      .notNull()
      .references(() => keywords.id, { onDelete: "cascade" }),
    title: text("title"),
    h1: text("h1"),
    slug: varchar("slug", { length: 500 }),
    metaTitle: varchar("meta_title", { length: 200 }),
    metaDescription: text("meta_description"),
    bodyHtml: text("body_html"),
    bodyMarkdown: text("body_markdown"),
    wordCount: integer("word_count").default(0),
    readabilityScore: real("readability_score"),
    keywordDensity: real("keyword_density"),
    qualityScore: integer("quality_score"),
    faq: jsonb("faq").default([]),
    schemaJson: jsonb("schema_json").default({}),
    sources: jsonb("sources").default([]),
    imagePrompts: jsonb("image_prompts").default([]),
    internalLinks: jsonb("internal_links").default([]),
    externalLinks: jsonb("external_links").default([]),
    validationReport: jsonb("validation_report").default({}),
    status: contentStatusEnum("status").default("draft").notNull(),
    version: integer("version").default(1),
    parentContentId: integer("parent_content_id"),
    ymyl: boolean("ymyl").default(false),
    flagged: boolean("flagged").default(false).notNull(),
    lastUpdatedReason: text("last_updated_reason"),
    ...timestamps,
  },
  (table) => ({
    projectIdx: index("contents_project_idx").on(table.projectId),
    keywordIdx: index("contents_keyword_idx").on(table.keywordId),
    statusIdx: index("contents_status_idx").on(table.status),
  })
);

export const contentVersions = pgTable(
  "content_versions",
  {
    id: serial("id").primaryKey(),
    contentId: integer("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    bodyHtml: text("body_html"),
    changedBy: integer("changed_by").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    contentIdx: index("content_versions_content_idx").on(table.contentId),
  })
);

export const generations = pgTable(
  "generations",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    contentId: integer("content_id").references(() => contents.id, { onDelete: "set null" }),
    stageTimings: jsonb("stage_timings").default({}),
    modelName: varchar("model_name", { length: 255 }),
    promptVersion: varchar("prompt_version", { length: 100 }),
    tokensIn: integer("tokens_in").default(0),
    tokensOut: integer("tokens_out").default(0),
    apiCostUsd: decimal("api_cost_usd", { precision: 10, scale: 6 }).default("0"),
    creditsUsed: integer("credits_used").default(0),
    durationMs: integer("duration_ms").default(0),
    status: generationStatusEnum("status").default("queued").notNull(),
    errorMessage: text("error_message"),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("generations_user_idx").on(table.userId),
    projectIdx: index("generations_project_idx").on(table.projectId),
  })
);

export const creditsLedger = pgTable(
  "credits_ledger",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    change: integer("change").notNull(),
    reason: text("reason").notNull(),
    referenceId: integer("reference_id"),
    balanceAfter: integer("balance_after").notNull(),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("credits_ledger_user_idx").on(table.userId),
  })
);

export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: varchar("plan", { length: 100 }).notNull(),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 10 }).default("INR"),
    gateway: varchar("gateway", { length: 100 }),
    gatewayRef: varchar("gateway_ref", { length: 255 }),
    gstin: varchar("gstin", { length: 50 }),
    invoiceUrl: varchar("invoice_url", { length: 1000 }),
    status: orderStatusEnum("status").default("pending").notNull(),
    ...timestamps,
  },
  (table) => ({
    userIdx: index("orders_user_idx").on(table.userId),
  })
);

export const exports = pgTable(
  "exports",
  {
    id: serial("id").primaryKey(),
    contentId: integer("content_id")
      .notNull()
      .references(() => contents.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    format: varchar("format", { length: 50 }).notNull(),
    target: varchar("target", { length: 100 }),
    meta: jsonb("meta").default({}),
    ...timestamps,
  },
  (table) => ({
    contentIdx: index("exports_content_idx").on(table.contentId),
  })
);

export const promptTemplates = pgTable(
  "prompt_templates",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 255 }).notNull(),
    stage: varchar("stage", { length: 100 }).notNull(),
    body: text("body").notNull(),
    version: integer("version").default(1).notNull(),
    isActive: boolean("is_active").default(true),
    createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => ({
    keyIdx: index("prompt_templates_key_idx").on(table.key),
    activeIdx: index("prompt_templates_active_idx").on(table.isActive),
  })
);

export const sessions = pgTable(
  "sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => ({
    tokenIdx: uniqueIndex("sessions_token_idx").on(table.token),
    userIdx: index("sessions_user_idx").on(table.userId),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  generations: many(generations),
  creditsLedger: many(creditsLedger),
  orders: many(orders),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  sources: many(sources),
  keywords: many(keywords),
  clusters: many(clusters),
  linkLibrary: many(linkLibrary),
  brandVoice: one(brandVoices, { fields: [projects.id], references: [brandVoices.projectId] }),
  briefs: many(briefs),
  contents: many(contents),
}));

export const brandVoicesRelations = relations(brandVoices, ({ one }) => ({
  project: one(projects, { fields: [brandVoices.projectId], references: [projects.id] }),
}));

export const keywordsRelations = relations(keywords, ({ one, many }) => ({
  project: one(projects, { fields: [keywords.projectId], references: [projects.id] }),
  source: one(sources, { fields: [keywords.sourceId], references: [sources.id] }),
  cluster: one(clusters, { fields: [keywords.clusterId], references: [clusters.id] }),
  secondaryOf: one(keywords, { fields: [keywords.secondaryOf], references: [keywords.id] }),
  secondaries: many(keywords),
}));

export const clustersRelations = relations(clusters, ({ one, many }) => ({
  project: one(projects, { fields: [clusters.projectId], references: [projects.id] }),
  keywords: many(keywords),
}));

export const briefsRelations = relations(briefs, ({ one }) => ({
  project: one(projects, { fields: [briefs.projectId], references: [projects.id] }),
  keyword: one(keywords, { fields: [briefs.keywordId], references: [keywords.id] }),
}));

export const contentsRelations = relations(contents, ({ one }) => ({
  project: one(projects, { fields: [contents.projectId], references: [projects.id] }),
  brief: one(briefs, { fields: [contents.briefId], references: [briefs.id] }),
  keyword: one(keywords, { fields: [contents.keywordId], references: [keywords.id] }),
}));

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    adminId: integer("admin_id").references(() => users.id, { onDelete: "set null" }),
    adminEmail: varchar("admin_email", { length: 255 }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    targetType: varchar("target_type", { length: 50 }),
    targetId: integer("target_id"),
    details: jsonb("details").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    adminIdx: index("audit_logs_admin_idx").on(table.adminId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    createdIdx: index("audit_logs_created_idx").on(table.createdAt),
  })
);
export const adminOtps = pgTable(
  "admin_otps",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: varchar("code_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("admin_otps_user_idx").on(table.userId),
  })
);

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    issue: varchar("issue", { length: 20 }).notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 20 }).default("open").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("contact_messages_status_idx").on(table.status),
  })
);
export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});


