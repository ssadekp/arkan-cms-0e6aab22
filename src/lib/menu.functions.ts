import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertStaff(userId: string) {
  const sb = await admin();
  const { data } = await sb.from("user_roles").select("role").eq("user_id", userId)
    .in("role", ["super_admin", "admin", "editor"]);
  if (!data || data.length === 0) throw new Error("Forbidden");
}

export const getMenu = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data } = await sb
    .from("menu_items" as any)
    .select("*")
    .eq("published", true)
    .order("position");
  return { items: (data as any[]) ?? [] };
});

export const adminListMenu = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const { data } = await sb.from("menu_items" as any).select("*").order("position");
    return { items: (data as any[]) ?? [] };
  });

const itemSchema = z.object({
  id: z.string().uuid().nullable(),
  parent_id: z.string().uuid().nullable(),
  position: z.number().int(),
  label_en: z.string(),
  label_ar: z.string(),
  url: z.string().min(1),
  target: z.enum(["_self", "_blank"]),
  published: z.boolean(),
});

export const saveMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => itemSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const tbl = sb.from("menu_items" as any) as any;
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await tbl.update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { id: _ignore, ...insert } = data;
    const { data: ins, error } = await tbl.insert(insert).select("id").single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const deleteMenuItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const { error } = await (sb.from("menu_items" as any) as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderMenuItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    items: z.array(z.object({ id: z.string().uuid(), position: z.number().int() })),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const tbl = sb.from("menu_items" as any) as any;
    for (const it of data.items) {
      await tbl.update({ position: it.position }).eq("id", it.id);
    }
    return { ok: true };
  });
