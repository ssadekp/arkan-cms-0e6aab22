#!/usr/bin/env bun
/**
 * White-label install script.
 *
 * Bootstraps a fresh deployment:
 *   1. Verify required env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      SUPABASE_PUBLISHABLE_KEY).
 *   2. Ensure storage buckets exist (site-media, charity-docs, user-avatars).
 *   3. Seed site_settings row (id=1) with sensible defaults.
 *   4. Create an initial admin user from ADMIN_EMAIL / ADMIN_PASSWORD and
 *      grant `admin` + `super_admin` roles.
 *
 * Usage (from a freshly cloned repo, after `bun install`):
 *   SUPABASE_URL=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   SUPABASE_PUBLISHABLE_KEY=... \
 *   ADMIN_EMAIL=you@example.com \
 *   ADMIN_PASSWORD='choose-a-strong-password' \
 *   bun run scripts/install.ts
 *
 * Idempotent: safe to re-run. Existing buckets, settings row, and admin
 * user are left in place.
 */
import { createClient } from "@supabase/supabase-js";

type Step = { name: string; run: () => Promise<string> };

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`\n✗ Missing required env var: ${name}`);
    process.exit(1);
  }
  return v;
}

const SUPABASE_URL = required("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = required("SUPABASE_SERVICE_ROLE_KEY");
required("SUPABASE_PUBLISHABLE_KEY"); // used by the app at runtime
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKETS: Array<{ id: string; public: boolean }> = [
  { id: "site-media", public: true },
  { id: "charity-docs", public: true },
  { id: "user-avatars", public: true },
];

const steps: Step[] = [
  {
    name: "Ensure storage buckets",
    run: async () => {
      const { data: existing } = await admin.storage.listBuckets();
      const have = new Set((existing ?? []).map((b) => b.id));
      const created: string[] = [];
      for (const b of BUCKETS) {
        if (have.has(b.id)) continue;
        const { error } = await admin.storage.createBucket(b.id, { public: b.public });
        if (error && !`${error.message}`.includes("already exists")) throw error;
        created.push(b.id);
      }
      return created.length ? `created: ${created.join(", ")}` : "already present";
    },
  },
  {
    name: "Seed site_settings row",
    run: async () => {
      const { error } = await admin
        .from("site_settings")
        .upsert({ id: 1 }, { onConflict: "id", ignoreDuplicates: true });
      if (error) throw error;
      return "ok";
    },
  },
  {
    name: "Create admin user",
    run: async () => {
      if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        return "skipped (set ADMIN_EMAIL and ADMIN_PASSWORD to create one)";
      }
      // Look for existing user by email
      const { data: list, error: listErr } = await admin.auth.admin.listUsers();
      if (listErr) throw listErr;
      let userId = list.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase())?.id;

      if (!userId) {
        const { data, error } = await admin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
        });
        if (error) throw error;
        userId = data.user!.id;
      }

      for (const role of ["admin", "super_admin"] as const) {
        const { error } = await admin
          .from("user_roles")
          .upsert({ user_id: userId, role }, { onConflict: "user_id,role", ignoreDuplicates: true });
        if (error) throw error;
      }
      return `${ADMIN_EMAIL} ready (roles: admin, super_admin)`;
    },
  },
];

async function main() {
  console.log("→ Installing white-label CMS\n");
  for (const s of steps) {
    process.stdout.write(`  • ${s.name} … `);
    try {
      const msg = await s.run();
      console.log(`ok — ${msg}`);
    } catch (e) {
      console.log("FAILED");
      console.error(e);
      process.exit(1);
    }
  }
  console.log("\n✓ Install complete. Start the app with `bun run dev`.");
}

main();
