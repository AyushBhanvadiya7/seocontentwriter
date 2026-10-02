CREATE TYPE "public"."content_status" AS ENUM('draft', 'approved', 'exported', 'published');--> statement-breakpoint
CREATE TYPE "public"."generation_status" AS ENUM('queued', 'running', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."keyword_status" AS ENUM('new', 'in_progress', 'done', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."user_plan" AS ENUM('free', 'starter', 'pro', 'agency');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "brand_voices" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"tone" varchar(100) DEFAULT 'simple English',
	"must_use_words" jsonb DEFAULT '[]'::jsonb,
	"banned_words" jsonb DEFAULT '[]'::jsonb,
	"author_name" varchar(255),
	"author_bio" text,
	"author_credentials" text,
	"sample_writing" text,
	"reading_level" varchar(50) DEFAULT 'Grade 7',
	"forbidden_topics" jsonb DEFAULT '[]'::jsonb,
	"unique_experience_facts" jsonb DEFAULT '[]'::jsonb,
	"standard_cta" text,
	"disclaimers" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "brand_voices_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
CREATE TABLE "briefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"keyword_id" integer NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"audience" text,
	"secondary_keywords" jsonb DEFAULT '[]'::jsonb,
	"target_words" integer DEFAULT 1200,
	"tone" varchar(100),
	"extra_instructions" text,
	"research_data" jsonb DEFAULT '{}'::jsonb,
	"outline" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(50) DEFAULT 'draft',
	"needs_facts" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clusters" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"keyword_count" integer DEFAULT 0,
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"version" integer NOT NULL,
	"body_html" text,
	"changed_by" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"brief_id" integer,
	"keyword_id" integer NOT NULL,
	"title" text,
	"h1" text,
	"slug" varchar(500),
	"meta_title" varchar(200),
	"meta_description" text,
	"body_html" text,
	"body_markdown" text,
	"word_count" integer DEFAULT 0,
	"readability_score" real,
	"keyword_density" real,
	"quality_score" integer,
	"faq" jsonb DEFAULT '[]'::jsonb,
	"schema_json" jsonb DEFAULT '{}'::jsonb,
	"sources" jsonb DEFAULT '[]'::jsonb,
	"image_prompts" jsonb DEFAULT '[]'::jsonb,
	"internal_links" jsonb DEFAULT '[]'::jsonb,
	"external_links" jsonb DEFAULT '[]'::jsonb,
	"validation_report" jsonb DEFAULT '{}'::jsonb,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1,
	"parent_content_id" integer,
	"ymyl" boolean DEFAULT false,
	"last_updated_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "credits_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"change" integer NOT NULL,
	"reason" text NOT NULL,
	"reference_id" integer,
	"balance_after" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "exports" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"format" varchar(50) NOT NULL,
	"target" varchar(100),
	"meta" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "generations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"content_id" integer,
	"stage_timings" jsonb DEFAULT '{}'::jsonb,
	"model_name" varchar(255),
	"prompt_version" varchar(100),
	"tokens_in" integer DEFAULT 0,
	"tokens_out" integer DEFAULT 0,
	"api_cost_usd" numeric(10, 6) DEFAULT '0',
	"credits_used" integer DEFAULT 0,
	"duration_ms" integer DEFAULT 0,
	"status" "generation_status" DEFAULT 'queued' NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"source_id" integer,
	"keyword" text NOT NULL,
	"normalized_keyword" text NOT NULL,
	"volume" integer,
	"difficulty" integer,
	"intent" varchar(50),
	"cluster_id" integer,
	"is_main" boolean DEFAULT false,
	"secondary_of" integer,
	"language" varchar(10),
	"city" varchar(255),
	"notes" text,
	"status" "keyword_status" DEFAULT 'new' NOT NULL,
	"used_in_content_id" integer,
	"priority" integer DEFAULT 0,
	"slug_guess" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "link_library" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"url" varchar(2000) NOT NULL,
	"slug" varchar(500),
	"page_title" varchar(500),
	"h1" text,
	"meta_description" text,
	"topic_tags" jsonb DEFAULT '[]'::jsonb,
	"anchor_options" jsonb DEFAULT '[]'::jsonb,
	"http_status" integer,
	"word_count" integer,
	"last_checked_at" timestamp with time zone,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan" varchar(100) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(10) DEFAULT 'INR',
	"gateway" varchar(100),
	"gateway_ref" varchar(255),
	"gstin" varchar(50),
	"invoice_url" varchar(1000),
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"website_url" varchar(500) NOT NULL,
	"business_description" text NOT NULL,
	"industry" varchar(255),
	"target_city" varchar(255),
	"target_country" varchar(100) DEFAULT 'IN',
	"audience" text,
	"products_services" text,
	"competitors" text,
	"language" varchar(10) DEFAULT 'en',
	"status" varchar(50) DEFAULT 'active',
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) NOT NULL,
	"stage" varchar(100) NOT NULL,
	"body" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_path" varchar(1000) NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"row_count" integer DEFAULT 0,
	"parse_report" jsonb DEFAULT '{}'::jsonb,
	"uploaded_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"plan" "user_plan" DEFAULT 'free' NOT NULL,
	"gstin" varchar(50),
	"phone" varchar(50),
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"timezone" varchar(100) DEFAULT 'Asia/Kolkata',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "brand_voices" ADD CONSTRAINT "brand_voices_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clusters" ADD CONSTRAINT "clusters_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_brief_id_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "public"."briefs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_keyword_id_keywords_id_fk" FOREIGN KEY ("keyword_id") REFERENCES "public"."keywords"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits_ledger" ADD CONSTRAINT "credits_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generations" ADD CONSTRAINT "generations_content_id_contents_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keywords" ADD CONSTRAINT "keywords_cluster_id_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."clusters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_library" ADD CONSTRAINT "link_library_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_templates" ADD CONSTRAINT "prompt_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_voices_project_idx" ON "brand_voices" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "briefs_project_idx" ON "briefs" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "briefs_keyword_idx" ON "briefs" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "clusters_project_idx" ON "clusters" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "content_versions_content_idx" ON "content_versions" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "contents_project_idx" ON "contents" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "contents_keyword_idx" ON "contents" USING btree ("keyword_id");--> statement-breakpoint
CREATE INDEX "contents_status_idx" ON "contents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "credits_ledger_user_idx" ON "credits_ledger" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "exports_content_idx" ON "exports" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "generations_user_idx" ON "generations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "generations_project_idx" ON "generations" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "keywords_project_idx" ON "keywords" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "keywords_cluster_idx" ON "keywords" USING btree ("cluster_id");--> statement-breakpoint
CREATE INDEX "keywords_normalized_idx" ON "keywords" USING btree ("normalized_keyword");--> statement-breakpoint
CREATE INDEX "keywords_status_idx" ON "keywords" USING btree ("status");--> statement-breakpoint
CREATE INDEX "link_library_project_idx" ON "link_library" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_user_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "prompt_templates_key_idx" ON "prompt_templates" USING btree ("key");--> statement-breakpoint
CREATE INDEX "prompt_templates_active_idx" ON "prompt_templates" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sources_project_idx" ON "sources" USING btree ("project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");