#!/usr/bin/env bun
/**
 * One-time administrator bootstrap for a new or existing self-hosted install.
 * Requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, and (only
 * when creating a new account) ADMIN_PASSWORD from the local environment.
 * Existing passwords are never changed by this script.
 */
import { createClient } from "@supabase/supabase-js";
import { getAdminSeederAction } from "./admin-seeder.policy";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

async function main() {
  const url = required("SUPABASE_URL");
  const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
  const email = required("ADMIN_EMAIL").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let targetUser: { id: string; email?: string } | null = null;
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`Could not check existing accounts: ${error.message}`);
    targetUser = data.users.find((user) => user.email?.toLowerCase() === email) ?? null;
    if (targetUser || data.users.length < 1000) break;
  }

  const { data: roleRows, error: roleError } = await admin
    .from("user_roles")
    .select("user_id, role");
  if (roleError) throw new Error(`Could not check existing administrator roles: ${roleError.message}`);

  const roles = (roleRows ?? []) as { user_id: string; role: string }[];
  const targetRoles = roles.filter((row) => row.user_id === targetUser?.id).map((row) => row.role);
  const existingSuperAdminId = roles.find((row) => row.role === "super_admin")?.user_id ?? null;
  const anyAdminExists = roles.some((row) => row.role === "admin" || row.role === "super_admin");
  const action = getAdminSeederAction({
    targetUserId: targetUser?.id ?? null,
    targetIsAdmin: targetRoles.includes("admin"),
    targetIsSuperAdmin: targetRoles.includes("super_admin"),
    anyAdminExists,
    existingSuperAdminId,
  });

  if (action === "already-seeded") {
    console.log(`${email} is already the super administrator. No account or password was changed.`);
    return;
  }

  if (action === "create-user") {
    if (!password || password.length < 12) {
      throw new Error("Creating a new administrator requires ADMIN_PASSWORD with at least 12 characters.");
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw new Error(`Could not create the administrator account: ${error.message}`);
    if (!data.user) throw new Error("The identity service did not return the created user.");
    targetUser = data.user;
  }

  if (!targetUser) throw new Error("The selected account could not be found.");

  const { error: roleWriteError } = await admin
    .from("user_roles")
    .upsert(
      [
        { user_id: targetUser.id, role: "admin" },
        { user_id: targetUser.id, role: "super_admin" },
      ],
      { onConflict: "user_id,role", ignoreDuplicates: true },
    );
  if (roleWriteError) {
    throw new Error(`The account exists, but administrator access was not fully applied: ${roleWriteError.message}. Rerun this command after correcting the issue.`);
  }

  const { error: settingsError } = await admin
    .from("site_settings")
    .upsert({ id: 1 }, { onConflict: "id", ignoreDuplicates: true });
  if (settingsError) throw new Error(`Administrator access is ready, but default settings could not be created: ${settingsError.message}`);

  console.log(`${email} now has administrator access. Existing account passwords were not changed.`);
  console.log("Remove ADMIN_PASSWORD from the local environment after first-time account creation.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Administrator bootstrap failed.");
  process.exitCode = 1;
});