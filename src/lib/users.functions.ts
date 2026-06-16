import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ALL_ROLES = ["super_admin", "admin", "editor", "author", "user"] as const;
type Role = (typeof ALL_ROLES)[number];

async function getCallerRoles(userId: string): Promise<Role[]> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  return ((data ?? []) as { role: Role }[]).map((r) => r.role);
}

function assertStaff(roles: Role[]) {
  if (!roles.some((r) => r === "super_admin" || r === "admin" || r === "editor")) {
    throw new Error("Forbidden");
  }
}
function assertSuperAdmin(roles: Role[]) {
  if (!roles.includes("super_admin")) throw new Error("Forbidden: super admin only");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    search: z.string().optional().default(""),
    role: z.string().optional().default("all"),
  }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const callerRoles = await getCallerRoles(context.userId);
    assertStaff(callerRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Get all auth users (paginated; first 1000 is fine for an admin panel)
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authErr) throw new Error(authErr.message);
    const authUsers = authData.users;

    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const roleMap = new Map<string, Role[]>();
    for (const r of (roles ?? []) as { user_id: string; role: Role }[]) {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    }

    let users = authUsers.map((u) => {
      const p: any = profileMap.get(u.id) ?? {};
      return {
        id: u.id,
        email: u.email ?? p.email ?? "",
        full_name: p.full_name ?? u.user_metadata?.full_name ?? "",
        phone: p.phone ?? u.phone ?? "",
        avatar_url: p.avatar_url ?? null,
        status: p.status ?? "active",
        created_at: u.created_at,
        last_login_at: u.last_sign_in_at ?? p.last_login_at ?? null,
        roles: roleMap.get(u.id) ?? [],
      };
    });

    if (data.search) {
      const q = data.search.toLowerCase();
      users = users.filter((u) =>
        u.email.toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q),
      );
    }
    if (data.role && data.role !== "all") {
      users = users.filter((u) => u.roles.includes(data.role as Role));
    }

    return { users, callerRoles };
  });

const userPayloadSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  phone: z.string().optional().default(""),
  avatar_url: z.string().nullable().optional(),
  role: z.enum(ALL_ROLES),
});

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => userPayloadSchema.parse(d))
  .handler(async ({ data, context }) => {
    const callerRoles = await getCallerRoles(context.userId);
    assertSuperAdmin(callerRoles);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const newId = created.user!.id;

    await supabaseAdmin.from("profiles").upsert({
      id: newId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      avatar_url: data.avatar_url || null,
      status: "active",
    });
    await supabaseAdmin.from("user_roles").insert({ user_id: newId, role: data.role as any });

    return { id: newId };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().optional(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  role: z.enum(ALL_ROLES).optional(),
});

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    const callerRoles = await getCallerRoles(context.userId);
    assertStaff(callerRoles);
    const isSuper = callerRoles.includes("super_admin");
    const isAdmin = callerRoles.includes("admin");
    if (data.role && !isSuper) throw new Error("Only super admin can change role");
    if (data.status && !isSuper && !isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, any> = {};
    if (data.full_name !== undefined) patch.full_name = data.full_name;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.avatar_url !== undefined) patch.avatar_url = data.avatar_url;
    if (data.status !== undefined) patch.status = data.status;

    if (Object.keys(patch).length > 0) {
      const { error } = await supabaseAdmin.from("profiles").update(patch as any).eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    if (data.role) {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
      await supabaseAdmin.from("user_roles").insert({ user_id: data.id, role: data.role as any });
    }
    if (data.status === "inactive" && isSuper) {
      // Optional: also ban in auth — keep simple, just flag profile.
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const callerRoles = await getCallerRoles(context.userId);
    assertSuperAdmin(callerRoles);
    if (data.id === context.userId) throw new Error("Cannot delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    password: z.string().min(8).max(128),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const callerRoles = await getCallerRoles(context.userId);
    if (!callerRoles.includes("super_admin") && !callerRoles.includes("admin")) {
      throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * One-time self-promotion: any existing admin can promote themselves to
 * super_admin, but only while no super_admin exists yet in the system.
 */
export const canSelfPromote = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const callerRoles = await getCallerRoles(context.userId);
    if (!callerRoles.includes("admin") && !callerRoles.includes("super_admin")) {
      return { eligible: false, hasSuperAdmin: false };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin" as any)
      .limit(1);
    const hasSuperAdmin = (data ?? []).length > 0;
    return {
      eligible: !hasSuperAdmin && callerRoles.includes("admin"),
      hasSuperAdmin,
      isSuperAdmin: callerRoles.includes("super_admin"),
    };
  });

export const promoteSelfToSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const callerRoles = await getCallerRoles(context.userId);
    if (!callerRoles.includes("admin")) throw new Error("Only an existing admin can self-promote");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin" as any)
      .limit(1);
    if ((existing ?? []).length > 0) throw new Error("A super admin already exists");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "super_admin" as any });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
