
# Plan: Settings cleanup, Users module, Admin i18n

## 1. Separate site name from About Us title

Right now `site_settings_i18n.site_name` is used for two things:
- The admin sidebar label (and brand name in the site)
- The hero/title on the public About Us page

Change:
- Add two new columns on `site_settings_i18n`: `admin_sidebar_name` (text) and keep `site_name` strictly for the public website name.
- Add a new column on `pages_i18n` (or a dedicated row on `site_settings_i18n`) for the **About Us page title** — proposal: add `about_title` on `site_settings_i18n` (AR/EN), shown as the H1 on the public About page.
- Settings page (admin): expose `site_name` (AR/EN) and `admin_sidebar_name` (AR/EN) as two separate, clearly labelled fields under a new "Site identity" section.
- About Us admin page: stop editing `site_name`; instead edit `about_title` (AR/EN) + tagline + short + body.
- `AdminShell` reads `admin_sidebar_name` (fallback to `site_name`).
- Public About route renders `about_title` as the H1 (fallback to current behaviour).

## 2. Users Management

New admin section **Users** with full CRUD and role-based access.

### Database
- Extend `app_role` enum with `super_admin` and `author` (keep existing `admin`, `editor`, plus `user`).
- Extend `public.profiles` with: `phone`, `avatar_url`, `status` (`active` / `inactive`, default `active`), `last_login_at`. (`full_name`, `email` already implied; if missing, add them too.)
- Trigger on `auth.users` sign-in to update `last_login_at` — or update from the client on successful sign-in (simpler, no auth-schema triggers).
- Helper SQL function `is_super_admin(uuid)` mirroring `has_role`.
- RLS:
  - `profiles`: user can read/update self; super_admin/admin can read all + update non-role fields.
  - `user_roles`: only super_admin can insert/delete/update.

### Server functions (`src/lib/users.functions.ts`)
All `.middleware([requireSupabaseAuth])`, gated by role checks:
- `listUsers({ search, role })` — super_admin/admin only. Joins `profiles` + `user_roles` + uses `supabaseAdmin.auth.admin.listUsers()` for email/last_sign_in_at.
- `createUser({ email, password, full_name, phone, role, avatar_url })` — super_admin only. Uses `supabaseAdmin.auth.admin.createUser`, then upserts profile + role.
- `updateUser({ id, full_name, phone, avatar_url, status, role })` — super_admin only for role; admin can edit profile fields except role.
- `deleteUser({ id })` — super_admin only.
- `setUserStatus({ id, status })` — super_admin/admin.
- `getUserProfile({ id })` — staff.

### UI (`src/routes/_authenticated/admin.users.tsx`)
- Table with: avatar, full name, email, phone, role badge, status badge, created, last login.
- Top bar: search input (name/email), role filter (`all` + each role).
- Row actions: Edit, Activate/Deactivate, Delete, View profile (drawer).
- "Add User" dialog with all fields including avatar upload (reuse existing image input pattern or plain URL).
- Permissions enforced both client-side (hide buttons) and server-side (role checks).
- Sidebar: add **Users** entry under a new top-level "Management" group (visible only to staff; "Add user / delete / change role" controls visible only to super_admin).

## 3. Admin panel i18n (AR/EN, RTL/LTR)

- Reuse the existing `useI18n()` provider. Expand the dictionary in `src/lib/i18n.tsx` with all admin strings (sidebar labels, page titles, table headers, buttons, form labels, toasts, confirmations, status names, role names).
- Replace every hard-coded English string in `src/components/admin/**` and `src/routes/_authenticated/admin.*.tsx` with `t("admin....")`.
- Add a language switcher in the admin header (next to the SidebarTrigger) calling `setLang(...)`.
- `dir`/`lang` already flip on `<html>` via the provider — verify sidebar uses logical CSS (`ms-*` / `me-*`) where needed; flip sidebar to the right side in RTL via `side="right"` on `<Sidebar>` when `dir === "rtl"`.
- Persist language choice (already done via `localStorage`).

### Out of scope for this task
- Translating user-generated content (already i18n via existing AR/EN columns).
- Email notifications for new users.

## Files affected

**New**
- `src/lib/users.functions.ts`
- `src/routes/_authenticated/admin.users.tsx`
- Migration: enum values, profiles columns, RLS, helper fn

**Edited**
- `src/lib/i18n.tsx` (dictionary)
- `src/components/admin/AdminShell.tsx` (i18n labels, language toggle, Users nav, sidebar side based on dir, use `admin_sidebar_name`)
- `src/lib/admin.functions.ts` (saveSiteSettings schema: add `admin_sidebar_name`, `about_title`)
- `src/routes/_authenticated/admin.settings.tsx` (new "Site identity" section)
- `src/routes/_authenticated/admin.about.tsx` (edit `about_title` instead of `site_name`)
- `src/routes/about.tsx` (use `about_title` for H1)
- All other `src/routes/_authenticated/admin.*.tsx` and admin components — replace strings with `t()`

## Confirm before I start

This is a large change (~15 files + migration). Want me to proceed end-to-end, or split into phases? I'd suggest this order if you prefer phases:
1. Settings/About separation (small)
2. Admin i18n
3. Users module (largest)
