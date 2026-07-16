# Charity CMS — Self-Hosted Install Guide

A bilingual (Arabic/English) charity/NGO content management system built on
TanStack Start + Supabase. This guide walks you through installing a fresh
instance on your own infrastructure.

Estimated time: **30–45 minutes** end-to-end.

---

## 1. Prerequisites

You will need:

| Requirement | Version | Notes |
|---|---|---|
| **Bun** | ≥ 1.1 | https://bun.sh — used for install, build, and scripts |
| **Node.js** | ≥ 20 (only if running the Node build target) | Not required if using Docker |
| **Docker + Docker Compose** | ≥ 24 | Optional, for containerized deploys |
| **A Supabase project** | any tier | https://supabase.com — free tier works for demos |
| **An SMTP sender** | any provider | Supabase Auth needs SMTP to send password-reset emails in production |
| **A domain name** | optional | For HTTPS in production |

---

## 2. Get the code

```bash
git clone <your-repo-url> charity-cms
cd charity-cms
bun install
```

---

## 3. Create the Supabase backend

1. Go to https://supabase.com/dashboard → **New project**.
2. Save the **Project URL**, **Project Ref**, **`anon` (publishable) key**, and **`service_role` key** — you will need all four.
3. In **SQL Editor**, run every file in `supabase/migrations/` **in filename order** (oldest first). This creates all tables, roles, RLS policies, storage buckets, and helper functions.
4. In **Authentication → URL Configuration**:
   - Set **Site URL** to your production URL (e.g. `https://charity.example.org`).
   - Add both `https://charity.example.org/**` and, for local dev, `http://localhost:3000/**` to **Redirect URLs**. Without this the password-reset link will bounce.
5. In **Authentication → Providers → Email**, keep **Confirm email** enabled and configure SMTP under **Project Settings → Auth → SMTP Settings**. Auth emails (including password reset) will not deliver reliably on the built-in Supabase SMTP.

---

## 4. Configure environment variables

Copy the example and fill it in:

```bash
cp .env.example .env
```

Required for every deploy:

```bash
# Client-visible (safe to ship to the browser)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=<project-ref>

# Server-only
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # keep secret — never commit

# Optional: bootstrap the first admin (only used by scripts/install.ts)
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=choose-a-strong-password

# Node/Docker web tier
PORT=3000
```

> **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser and never prefix
> it with `VITE_`. It bypasses Row-Level Security.

---

## 5. Bootstrap the instance

Run once, from the project root, with the `.env` loaded:

```bash
bun run install:bootstrap
```

This will:

1. Verify required env vars.
2. Create the storage buckets (`site-media`, `charity-docs`, `user-avatars`) if missing.
3. Seed the default `site_settings` row.
4. Create the initial admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and grant `admin` + `super_admin` roles.

The script is idempotent — safe to re-run.

Then confirm everything is wired up:

```bash
bun run doctor
```

You should see `✓ All checks passed.`

---

## 6. Run it

### Local development

```bash
bun run dev
```

Open http://localhost:3000, sign in at `/auth` with the admin credentials, and land on `/admin`.

### Production (Node)

```bash
bun run build:node
node .output/server/index.mjs
```

### Production (Docker)

```bash
docker compose up -d --build
```

The container reads the same `.env` file. Put a reverse proxy (Caddy, nginx, Cloudflare) in front for HTTPS.

---

## 7. Forgot your admin password?

1. Go to `/auth` → **Forgot your password?**
2. Enter your admin email. Supabase Auth sends a reset link (delivered via the SMTP you configured in step 3).
3. Click the link — it opens `/reset-password`, where you can set a new password.
4. On success, you are signed in and redirected to `/admin`.

If email delivery is broken, a super_admin can also reset any user's password from **Admin → Users → Reset password**.

---

## 8. Post-install checklist

Once you can sign in, walk through these once to make the deployment yours:

- **Admin → Settings** — site name, contact info, sponsorship text, header scripts (GTM), visitor counter.
- **Admin → Branding** — colors, radii, fonts.
- **Admin → Homepage** — hero image/title/tagline, section toggles.
- **Admin → Main Menu** — top nav.
- **Admin → Focus Areas / Projects / News / Partners / Documents** — real content (sample bilingual data is seeded by default).
- **Admin → Users** — invite editors, revoke the seeded demo admin if you don't need it.

---

## 9. Upgrading

```bash
git pull
bun install
# Run any NEW migrations in supabase/migrations/ via the SQL editor.
bun run doctor
```

No data is destroyed by re-running `install:bootstrap`.

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| `bun run doctor` reports missing tables | Migrations weren't applied — re-run every file in `supabase/migrations/` |
| Storage buckets missing | Re-run `bun run install:bootstrap` |
| Password reset email never arrives | Configure SMTP in **Supabase → Project Settings → Auth → SMTP** |
| Reset link opens but says "Validating…" forever | Add your domain to **Supabase → Auth → Redirect URLs** |
| `Unauthorized: No authorization header provided` from admin pages | Sign out and back in; the client bearer token expired |
| Sign-in works but `/admin` shows a blank sidebar | The signed-in user has no `admin` role — run `install:bootstrap` again with that email, or grant the role via SQL |
| `Expected 3 parts in JWT; got 1` in server logs | You put a `sb_secret_*` key where a `sb_publishable_*` key belongs (or vice versa) — recheck `.env` |

---

## What lives where

```
scripts/
  install.ts      # one-shot bootstrap (buckets, settings, admin user)
  doctor.ts       # read-only health check
supabase/
  migrations/     # database schema — apply in order
src/
  routes/         # TanStack Start file-based routes (public + /admin + /api)
  components/     # UI components
  lib/            # server functions (*.functions.ts) + shared client helpers
  integrations/   # auto-generated Supabase clients (do not edit)
Dockerfile
docker-compose.yml
.env.example
```
