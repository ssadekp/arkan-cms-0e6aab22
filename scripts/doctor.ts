#!/usr/bin/env bun
/**
 * White-label health check.
 *
 * Verifies a deployment is wired up correctly. Read-only — never mutates.
 *
 *   - Required env vars are set.
 *   - Supabase reachable with the service role key.
 *   - Core tables exist and are readable.
 *   - Storage buckets exist and are public.
 *   - At least one admin user exists.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run scripts/doctor.ts
 *
 * Exit code 0 = healthy, 1 = one or more checks failed.
 */
import { createClient } from "@supabase/supabase-js";

const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const REQUIRED_TABLES = [
  "site_settings",
  "profiles",
  "user_roles",
  "focus_areas",
  "projects",
  "news",
  "partners",
  "documents",
  "menu_items",
  "contact_forms",
  "social_links",
  "theme_tokens",
] as const;

const REQUIRED_BUCKETS = ["site-media", "charity-docs", "user-avatars"] as const;

type Result = { name: string; ok: boolean; detail: string };
const results: Result[] = [];
const ok = (name: string, detail = "ok") => results.push({ name, ok: true, detail });
const bad = (name: string, detail: string) => results.push({ name, ok: false, detail });

for (const k of REQUIRED_ENV) {
  if (process.env[k]) ok(`env ${k}`);
  else bad(`env ${k}`, "missing");
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (url && key) {
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const t of REQUIRED_TABLES) {
    const { error } = await admin.from(t).select("*", { count: "exact", head: true });
    if (error) bad(`table ${t}`, error.message);
    else ok(`table ${t}`);
  }

  const { data: buckets, error: bErr } = await admin.storage.listBuckets();
  if (bErr) bad("storage", bErr.message);
  else {
    const map = new Map((buckets ?? []).map((b) => [b.id, b]));
    for (const id of REQUIRED_BUCKETS) {
      const b = map.get(id);
      if (!b) bad(`bucket ${id}`, "missing");
      else if (!b.public) bad(`bucket ${id}`, "exists but not public");
      else ok(`bucket ${id}`);
    }
  }

  const { data: admins, error: rErr } = await admin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1);
  if (rErr) bad("admin user", rErr.message);
  else if (!admins || admins.length === 0)
    bad("admin user", "no admin found — run scripts/install.ts");
  else ok("admin user");
}

console.log("\nHealth check\n────────────");
for (const r of results) {
  console.log(`  ${r.ok ? "✓" : "✗"}  ${r.name.padEnd(28)} ${r.detail}`);
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${failed === 0 ? "✓ All checks passed." : `✗ ${failed} check(s) failed.`}`);
process.exit(failed === 0 ? 0 : 1);
