# SEO Content Writer

A Next.js application for organizing SEO keywords and generating researched, publish-ready articles. Users can create website projects, import keyword lists, set a brand voice, generate content with an AI provider, and export articles with SEO metadata and schema.

## Deploy to Vercel

This repository is configured for Vercel. The project uses **PostgreSQL + Drizzle ORM**; Vercel's filesystem is not used as persistent storage.

### 1. Import the GitHub repository

In Vercel, choose **Add New → Project**, import this repository, and keep the detected **Next.js** framework. `vercel.json` configures the install and build commands. Each deployment runs:

```text
npm ci → npm run db:migrate → npm run build
```

A deployment intentionally fails if migrations fail or no database URL is configured. Migrations run before the new application build is published.

### 2. Connect PostgreSQL

Recommended: add the **Neon Postgres integration** from the Vercel Marketplace. It supplies:

- `DATABASE_URL` — pooled connection for application requests.
- `DATABASE_URL_UNPOOLED` — direct connection for schema migrations.

The build uses `DATABASE_URL_UNPOOLED` when available and falls back to `DATABASE_URL`. If you use another managed PostgreSQL provider, set these variables yourself. Keep `DATABASE_URL` on the provider's serverless/pooler endpoint and use a direct URL for `DATABASE_URL_UNPOOLED` where possible.

Use a separate database or Neon branch for **Preview** deployments; do not point previews at the production database. Make sure the database environment variables are enabled for the Vercel environments in which the project will build.

### 3. Add environment variables in Vercel

Set secrets under **Project → Settings → Environment Variables**. Apply the required values to Production and to any Preview/Development environments you plan to use. Never commit keys or put secret keys in `NEXT_PUBLIC_` variables.

**Required to run:**

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL URL used by the app. |
| `SESSION_SECRET` | Iron-session encryption key; at least 32 characters. Generate one with `openssl rand -base64 32`. Use a private value, not the example or a value from this README. |

**Recommended canonical URL settings:** set `SITE_URL` to the public HTTPS origin, for example `https://your-project.vercel.app`. Vercel system URL variables are used as a fallback. `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` may also be set to the same public origin. `NEXT_PUBLIC_APP_NAME` is optional.

**At least one AI provider is required to generate articles.** The app selects the first configured provider in this order: AIMLAPI, Gemini, then OpenAI. If you set more than one, the first one wins.

| Provider | Variables |
| --- | --- |
| AIMLAPI | `AIMLAPI_KEY`, optional `AIMLAPI_MODEL` |
| Google Gemini | `GEMINI_API_KEY`, optional `GEMINI_MODEL` |
| OpenAI | `OPENAI_API_KEY`, optional `OPENAI_MODEL` |

Other optional integrations:

| Integration | Variables / notes |
| --- | --- |
| Live SERP research | `SERPER_API_KEY`; optional `SERPER_GL` and `SERPER_HL`. |
| Email | `RESEND_API_KEY` and a verified-domain `EMAIL_FROM`. Needed for email verification, password resets, and admin one-time codes. `CONTACT_TO` controls the contact/support destination. |
| Razorpay payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. After deploying, configure the Razorpay webhook URL as `https://your-domain/api/billing/webhook`. Keep the secret key and webhook secret server-only. |
| Sentry | `NEXT_PUBLIC_SENTRY_DSN`; source-map uploads additionally use `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`. |

The full variable list and local defaults are in [`.env.example`](.env.example). Do not enter any real keys in this repository or in chat; add them through Vercel's environment-variable UI or your secret manager.

### 4. Deploy and check health

Deploy from Vercel. The first build creates/updates the database schema before compiling the site. Once it is live, open:

- `https://your-domain/api/health` — checks application-to-database connectivity.
- The website's registration/login and project creation flow.

An AI key is necessary for article generation; a Serper key enables live search research; Resend is needed for email-delivered flows; Razorpay is needed only if you want paid credit packs. The app can be deployed without those optional integrations, but the related features will not be fully operational.

### 5. Create the first admin (optional)

Normal users can register without an admin seed. To enable the admin area, run the seed script once against the production database from a trusted local machine:

1. Install the Vercel CLI and link the local checkout to the Vercel project with `npx vercel link`.
2. Pull the Production variables into the ignored local `.env` file: `npx vercel env pull .env --environment=production`.
3. Add `SEED_ADMIN_EMAIL` and a unique `SEED_ADMIN_PASSWORD` (at least 16 characters) to that local `.env` file, then run `npm run db:seed`.
4. Remove the temporary seed-password value from `.env` after the seed completes. The `.env` file is ignored by Git.

Admin sign-in uses an email one-time code, so configure Resend before relying on admin access.

## Local development

Requirements: Node.js 22 and PostgreSQL.

```bash
npm ci
cp .env.example .env
```

Set `DATABASE_URL` to a PostgreSQL connection string, set `SESSION_SECRET` to a random value of at least 32 characters, and choose a `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` (at least 16 characters) for the required local seed. Then run:

```bash
npm run db:setup   # apply checked-in migrations and add prompt templates/admin
npm run dev
```

Open <http://localhost:3000>. You may add an AI provider key to generate real articles. Database migrations can also be run separately with `npm run db:migrate`.

Useful checks:

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run build` compiles the app only. Vercel's `vercel-build` command also runs the migrations.

## Deployment and storage notes

- Keyword file uploads are parsed during the request and temporarily written to the function's local temp directory. Vercel functions have a 4.5 MB request-body ceiling, so the app limits keyword files to 4 MB. Temporary files are not an archive and are not durable. If you need permanent file storage or larger uploads, add object storage (for example, Vercel Blob with direct client uploads).
- Rate limits currently use per-process memory. They are useful as a basic safeguard, but are not globally shared across serverless instances. For high-traffic or abuse-sensitive production use, connect a shared rate-limit store such as Upstash Redis.
- `DATABASE_URL` and every provider/payment/email key are server-side secrets. Only explicitly public values (such as a Sentry DSN or Razorpay Key ID) should use `NEXT_PUBLIC_`.

## Project layout

```text
src/app/       Next.js App Router pages and API routes
src/components Shared UI and project workspace
src/db/        Drizzle schema, database client, migrations, and seed script
drizzle/       Checked-in PostgreSQL migration files
src/lib/       Authentication, uploads, AI providers, generation, billing, and utilities
src/proxy.ts   Session gate and API rate-limit proxy
```
