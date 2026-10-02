# SEO Content Writer

A web-based SEO content generation tool. A user creates a Project for one website, uploads a keyword file, imports page URLs, sets a brand voice, and then generates researched, humanized, publish-ready articles with internal links, meta tags, JSON-LD schema, and image prompts.

> **Note about the original specification:** The full product spec requested **PHP 8.3 + Laravel 11 + MySQL 8 + Redis**. This sandbox environment only provides **Node.js + PostgreSQL**, so this prototype is built with **Next.js 16 + React + TypeScript + PostgreSQL + Drizzle ORM**. The database schema, feature set, and UI faithfully mirror the spec so the product can be ported to Laravel/MySQL/Redis later.
>
> **Login removed:** For this release, login is disabled. Everyone uses the same guest/admin account automatically. You can open the site and use it immediately.

## What is implemented in this release

- No login required — open and use immediately.
- Dashboard with project cards and recent content.
- Project create wizard (Steps 1–2 fully, Steps 3–5 in the workspace).
- Keyword file upload: CSV, XLSX, XLS, TXT, JSON, PDF, DOCX.
- Parser: delimiter/header/column detection, keyword cleaning, de-duplication, preview, parse report.
- Keyword table: search, status filter, status update, delete, bulk paste add.
- Generate form pre-filled from keyword row: content type, word count, tone, secondary keywords.
- Content engine skeleton with 8-stage pipeline and demo fallback.
- Result screen: article preview / HTML / Markdown, SEO panel, validation report, internal/external links, image prompt cards.
- Content library, settings, and admin panels (basic).
- Database schema matching Section 10 of the spec.
- Prompt templates table seeded with versioned prompts.
- Credits ledger with automatic deduction and refund on failure.

## Tech stack in this repo

- Next.js 16 (App Router)
- React 19 + TypeScript 5
- Tailwind CSS 4
- PostgreSQL 16
- Drizzle ORM
- Iron Session (auth currently disabled)
- bcryptjs (password hashing)
- csv-parse, xlsx, pdf-parse, mammoth (parsing)
- marked + DOMPurify (rendering / sanitization)

---

## How to run on your own PC

### 1. Install required software

You need these free tools on your computer:

| Tool | Download | Why you need it |
|------|----------|-----------------|
| Node.js 20+ | https://nodejs.org | Runs the website code |
| PostgreSQL 14+ | https://postgresql.org | Stores projects, keywords and articles |
| Git | https://git-scm.com | Downloads the code |

### 2. Download the project

Open a terminal (Command Prompt / PowerShell on Windows, Terminal on Mac/Linux) and run:

```bash
git clone <your-repo-url>
cd seo-content-writer
```

### 3. Install project dependencies

```bash
npm install
```

This downloads all the libraries the website needs.

### 4. Start PostgreSQL and create the database

**Windows:** Start "pgAdmin" or the PostgreSQL service from Services.

**Mac (Homebrew):**
```bash
brew services start postgresql@16
```

**Ubuntu/Linux:**
```bash
sudo service postgresql start
```

Then create the database:
```bash
createdb -U postgres app_db
```

If `createdb` asks for a password, enter the password you set during PostgreSQL installation.

### 5. Set up the environment file

```bash
cp .env.example .env
```

Open `.env` in any text editor and set:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/app_db"
SESSION_SECRET="paste-a-random-32-character-string-here"
```

- Replace `YOUR_PASSWORD` with your PostgreSQL password.
- `SESSION_SECRET` can be any long random text. You can generate one with:
  ```bash
  openssl rand -base64 32
  ```

Optional (real AI generation):
```env
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
```

Without `OPENAI_API_KEY` the app runs in **demo mode** and creates sample articles.

### 6. Create the database tables

```bash
npx drizzle-kit push
```

### 7. Seed the database

```bash
set -a && source .env && set +a
npx tsx src/db/seed.ts
```

This creates the default user and prompt templates.

### 8. Start the website

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

You can use the website immediately — no login required.

---

## How to use the website from another PC on the same network

### Step 1: Find your PC's local IP address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g. `192.168.1.45`).

**Mac/Linux:**
```bash
ifconfig
# or
ip addr
```
Look for `inet` under your Wi-Fi or Ethernet adapter (e.g. `192.168.1.45`).

### Step 2: Start the website so it listens on all network interfaces

Instead of `npm run dev`, start with:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Or for the production build:
```bash
npm run build
npm start -- --hostname 0.0.0.0 --port 3000
```

`0.0.0.0` means "accept connections from any computer on the network."

### Step 3: Open the website on the other PC

On the other computer, open a browser and type:

```
http://192.168.1.45:3000
```

Replace `192.168.1.45` with the IP address you found in Step 1.

Both PCs must be connected to the same Wi-Fi or router.

---

## How to use the website from any computer on the internet (optional, advanced)

If you want to use it from outside your home/office, you have a few options:

1. **Cloud server (recommended for production):**
   - Rent a VPS from DigitalOcean, AWS, Hetzner, etc.
   - Install Node.js and PostgreSQL on the server.
   - Upload the project, run `npm install`, `npx drizzle-kit push`, `npm run build`, `npm start`.
   - Point your domain to the server IP and use Nginx or Caddy as a reverse proxy.

2. **Tunnel services (quick testing):**
   - Use a tool like **Cloudflare Tunnel** or **ngrok** to expose your local PC to the internet.
   - Example with ngrok:
     ```bash
     ngrok http 3000
     ```
   - ngrok will give you a public URL like `https://abc123.ngrok.io` that anyone can open.

3. **Home router port forwarding (not recommended for security reasons):**
   - Forward port 3000 on your router to your PC's local IP.
   - Find your public IP at https://whatismyipaddress.com.
   - Others can visit `http://YOUR_PUBLIC_IP:3000`.
   - Only do this temporarily and only if you understand the security risks.

---

## Quick start: testing the core flow

1. Open **http://localhost:3000** (or your network IP).
2. Click **Start using it free** or **Dashboard**.
3. Click **New project** and fill in the website name, URL, city and a business description (must be at least 100 characters).
4. In the project workspace, open the **Keywords** tab.
5. Upload a CSV file with a `keyword` column, or click **Paste keywords** and add keywords one per line.
6. Click **Save keywords**.
7. Click **Make content** on any keyword row.
8. Click **Generate**. In demo mode this creates a sample article instantly.
9. View the result, copy HTML, or download `.md`, `.html` or `.json`.

---

## How to stop the website

In the terminal where the website is running, press **Ctrl + C**.

---

## Project structure

```
src/
  app/            Next.js pages and API routes
  components/     Shared React components
  db/             Drizzle schema, DB client, seed script
  lib/            Business logic: auth, parser, LLM providers, generation engine
```

## Important notes

- This is a working prototype of Stage A and Stage B from the build order. The full 8-stage content engine uses real LLM calls when `OPENAI_API_KEY` is set; otherwise it runs in demo mode.
- File uploads are stored under `/tmp/seo-writer-uploads` by default. Change `UPLOAD_DIR` in production and ensure it is outside the web root.
- For Laravel/MySQL/Redis delivery, the domain model, table schema, API contracts, and prompt library from this repo can be ported directly to PHP/Laravel.
