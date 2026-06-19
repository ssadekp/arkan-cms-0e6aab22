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

export const getMenuPickerOptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const [pages, pagesI18n, forms, focus, focusI18n] = await Promise.all([
      sb.from("pages").select("id, slug").eq("published", true),
      sb.from("pages_i18n").select("page_id, lang, title"),
      sb.from("contact_forms" as any).select("id, slug, title_en, title_ar").eq("published", true),
      sb.from("focus_areas").select("id, slug").eq("published", true),
      sb.from("focus_areas_i18n").select("focus_area_id, lang, title"),
    ]);
    return {
      pages: (pages.data ?? []).map((p: any) => {
        const en = (pagesI18n.data ?? []).find((x: any) => x.page_id === p.id && x.lang === "en");
        const ar = (pagesI18n.data ?? []).find((x: any) => x.page_id === p.id && x.lang === "ar");
        return { label_en: en?.title || p.slug, label_ar: ar?.title || p.slug, url: `/p/${p.slug}` };
      }),
      forms: ((forms.data as any[]) ?? []).map((f: any) => ({
        label_en: f.title_en || f.slug, label_ar: f.title_ar || f.slug, url: `/forms/${f.slug}`,
      })),
      focusAreas: ((focus.data as any[]) ?? []).map((p: any) => {
        const en = (focusI18n.data ?? []).find((x: any) => x.focus_area_id === p.id && x.lang === "en");
        const ar = (focusI18n.data ?? []).find((x: any) => x.focus_area_id === p.id && x.lang === "ar");
        return { label_en: en?.title || p.slug, label_ar: ar?.title || p.slug, url: `/focus-areas/${p.slug}` };
      }),
    };
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
