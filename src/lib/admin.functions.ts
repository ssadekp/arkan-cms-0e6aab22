import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertStaff(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "editor"]);
  if (!data || data.length === 0) throw new Error("Forbidden");
}

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId);
    return (data ?? []).map((r) => r.role);
  });

/* ---------- ADMIN LIST FETCHERS ---------- */

export const adminListAll = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const [pages, pagesI18n, focus, focusI18n, projects, projectsI18n, news, newsI18n, partners, partnersI18n, settings, settingsI18n, stats, statsI18n, tags, tagsI18n, projectTags, projectPartners, focusAreaPartners] = await Promise.all([
      sb.from("pages").select("*").order("nav_order"),
      sb.from("pages_i18n").select("*"),
      sb.from("focus_areas").select("*").order("sort_order"),
      sb.from("focus_areas_i18n").select("*"),
      sb.from("projects").select("*").order("created_at", { ascending: false }),
      sb.from("projects_i18n").select("*"),
      sb.from("news").select("*").order("published_at", { ascending: false }),
      sb.from("news_i18n").select("*"),
      sb.from("partners").select("*").order("sort_order"),
      sb.from("partners_i18n" as any).select("*"),
      sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      sb.from("site_settings_i18n").select("*").eq("setting_id", 1),
      sb.from("homepage_stats").select("*").order("sort_order"),
      sb.from("homepage_stats_i18n").select("*"),
      sb.from("tags").select("*"),
      sb.from("tags_i18n").select("*"),
      sb.from("project_tags").select("*"),
      sb.from("project_partners").select("*"),
      sb.from("focus_area_partners" as any).select("*"),
    ]);
    return {
      pages: pages.data ?? [], pagesI18n: pagesI18n.data ?? [],
      focus: focus.data ?? [], focusI18n: focusI18n.data ?? [],
      projects: projects.data ?? [], projectsI18n: projectsI18n.data ?? [],
      news: news.data ?? [], newsI18n: newsI18n.data ?? [],
      partners: partners.data ?? [], partnersI18n: (partnersI18n.data as any[]) ?? [],
      settings: settings.data, settingsI18n: settingsI18n.data ?? [],
      stats: stats.data ?? [], statsI18n: statsI18n.data ?? [],
      tags: tags.data ?? [], tagsI18n: tagsI18n.data ?? [],
      projectTags: projectTags.data ?? [],
      projectPartners: (projectPartners.data as any[]) ?? [],
      focusAreaPartners: (focusAreaPartners.data as any[]) ?? [],
    };
  });


/* ---------- SETTINGS ---------- */

const settingsSchema = z.object({
  logo_url: z.string().nullable().optional(),
  primary_color: z.string().min(1),
  accent_color: z.string().min(1),
  default_language: z.enum(["ar", "en"]),
  contact_email: z.string().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  seo_og_image: z.string().nullable().optional(),
  map_embed_url: z.string().nullable().optional(),
  social_links: z.record(z.string(), z.string()),

  i18n: z.array(z.object({
    lang: z.enum(["ar", "en"]),
    site_name: z.string(),
    admin_sidebar_name: z.string().optional().default(""),
    about_title: z.string().optional().default(""),
    tagline: z.string(),
    about_short: z.string(),
    about_body: z.string().optional().default(""),
    footer_text: z.string(),
    seo_title: z.string(),
    seo_description: z.string(),
    address: z.string(),
  })),

});

export const saveSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => settingsSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { i18n, ...root } = data;
    await sb.from("site_settings").update(root).eq("id", 1);
    for (const row of i18n) {
      await sb.from("site_settings_i18n").upsert({ setting_id: 1, ...row });
    }
    return { ok: true };
  });

/* ---------- GENERIC CRUD ---------- */

const resourceSchema = z.object({
  table: z.enum(["pages", "focus_areas", "projects", "news", "partners", "homepage_stats"]),
  id: z.string().uuid().nullable(),
  values: z.record(z.string(), z.any()),
  i18n: z.array(z.object({ lang: z.enum(["ar", "en"]) }).passthrough()).optional(),
});

const i18nKeyMap: Record<string, { table: string; fk: string }> = {
  pages: { table: "pages_i18n", fk: "page_id" },
  focus_areas: { table: "focus_areas_i18n", fk: "focus_area_id" },
  projects: { table: "projects_i18n", fk: "project_id" },
  news: { table: "news_i18n", fk: "news_id" },
  homepage_stats: { table: "homepage_stats_i18n", fk: "stat_id" },
  partners: { table: "partners_i18n", fk: "partner_id" },
};


export const saveResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => resourceSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const tbl = sb.from(data.table as any) as any;
    let recordId = data.id;
    if (recordId) {
      const { error } = await tbl.update(data.values).eq("id", recordId);
      if (error) throw new Error(error.message);
    } else {
      const { data: ins, error } = await tbl.insert(data.values).select("id").single();
      if (error) throw new Error(error.message);
      recordId = ins.id as string;
    }
    const map = i18nKeyMap[data.table];
    if (map && data.i18n) {
      for (const row of data.i18n) {
        const payload = { ...row, [map.fk]: recordId };
        await (sb.from(map.table as any) as any).upsert(payload);
      }
    }

    return { id: recordId };
  });

export const deleteResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      table: z.enum(["pages", "focus_areas", "projects", "news", "partners", "homepage_stats"]),
      id: z.string().uuid(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { error } = await (sb.from(data.table as any) as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- TAGS ---------- */

export const saveTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid().nullable(),
    slug: z.string().min(1),
    name_ar: z.string(),
    name_en: z.string(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    let id = data.id;
    if (id) {
      const { error } = await sb.from("tags").update({ slug: data.slug }).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: ins, error } = await sb.from("tags").insert({ slug: data.slug }).select("id").single();
      if (error) throw new Error(error.message);
      id = ins.id as string;
    }
    await sb.from("tags_i18n").upsert({ tag_id: id, lang: "ar", name: data.name_ar });
    await sb.from("tags_i18n").upsert({ tag_id: id, lang: "en", name: data.name_en });
    return { id };
  });

export const deleteTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { error } = await sb.from("tags").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setProjectTags = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    project_id: z.string().uuid(),
    tag_ids: z.array(z.string().uuid()),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    await sb.from("project_tags").delete().eq("project_id", data.project_id);
    if (data.tag_ids.length > 0) {
      const rows = data.tag_ids.map((tag_id) => ({ project_id: data.project_id, tag_id }));
      const { error } = await sb.from("project_tags").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ---------- PARTNER LINKS ---------- */

export const setProjectPartners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    project_id: z.string().uuid(),
    partner_ids: z.array(z.string().uuid()),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    await sb.from("project_partners").delete().eq("project_id", data.project_id);
    if (data.partner_ids.length > 0) {
      const rows = data.partner_ids.map((partner_id) => ({ project_id: data.project_id, partner_id }));
      const { error } = await sb.from("project_partners").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setFocusAreaPartners = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    focus_area_id: z.string().uuid(),
    partner_ids: z.array(z.string().uuid()),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    await (sb.from("focus_area_partners" as any) as any).delete().eq("focus_area_id", data.focus_area_id);
    if (data.partner_ids.length > 0) {
      const rows = data.partner_ids.map((partner_id) => ({ focus_area_id: data.focus_area_id, partner_id }));
      const { error } = await (sb.from("focus_area_partners" as any) as any).insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });
