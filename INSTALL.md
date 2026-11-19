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

# Only for the private, one-time administrator bootstrap (`bun run seed:admin`).
# Choose a strong unique password locally; never commit it or use a shared default.
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=

# Node/Docker web tier
PORT=3000
```

> **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser and never prefix
> it with `VITE_`. It bypasses Row-Level Security.

---

## 5. Bootstrap the instance

First create the initial super administrator through the private CLI seeder. Do
not expose the service-role key or run the seeder from a public web request.
Keep `.env` private, use a unique password of at least 12 characters, and clear
`ADMIN_PASSWORD` after the new account is created.

```bash
read -rp "Administrator email: " ADMIN_EMAIL
read -rsp "New administrator password: " ADMIN_PASSWORD
printf '\n'
export ADMIN_EMAIL ADMIN_PASSWORD
bun run seed:admin
unset ADMIN_EMAIL ADMIN_PASSWORD
```

The seeder creates the account and assigns `admin` and `super_admin` only when
there is no administrator yet. If the selected email already belongs to an
account, it assigns the roles to that account without changing its password.
It refuses to create or promote a second super administrator. Running it again
for the same super administrator makes no changes. For an existing deployment
with an administrator but no super administrator, set `ADMIN_EMAIL` to that
existing administrator's email and run the seeder once.

Afterwards, use `/auth` to sign in. The setup wizard no longer creates users or
grants roles; it only configures site identity and branding after sign-in.
The super administrator can later update account details or reset passwords in
**Admin → Users**; administrators can also use the forgot-password email flow.

### Prepare the site storage and settings

Run once, from the project root, with the server environment loaded:

```bash
bun run install:bootstrap
```


This prepares the site; it does not create an administrator:

1. Verify required env vars.
2. Create the storage buckets (`site-media`, `charity-docs`, `user-avatars`) if missing.
3. Seed the default `site_settings` row.
The script is idempotent — safe to re-run. It does not create users or assign roles.

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

Open http://localhost:3000 and sign in at `/auth` with the credentials selected for the one-time bootstrap.

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
- **Admin → Users** — add staff accounts, update profiles, and manage roles.

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
| Sign-in works but `/admin` shows a blank sidebar | The signed-in account has no control-panel role. Use the private seeder only for a fresh installation or an existing administrator being designated as the first super administrator. |
| `Expected 3 parts in JWT; got 1` in server logs | You put a `sb_secret_*` key where a `sb_publishable_*` key belongs (or vice versa) — recheck `.env` |

---

## What lives where

```
scripts/
  install.ts      # site bootstrap (buckets and default settings; no user creation)
  seed-admin.ts   # private, one-time super-administrator bootstrap
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
