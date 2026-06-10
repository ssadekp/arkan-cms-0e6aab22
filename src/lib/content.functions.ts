import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [settings, settingsI18n, stats, statsI18n, navPages, navPagesI18n] = await Promise.all([
    sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("site_settings_i18n").select("*").eq("setting_id", 1),
    sb.from("homepage_stats").select("*").eq("active", true).order("sort_order"),
    sb.from("homepage_stats_i18n").select("*"),
    sb.from("pages").select("id, slug, show_in_nav, nav_order").eq("show_in_nav", true).eq("published", true).order("nav_order"),
    sb.from("pages_i18n").select("page_id, lang, title"),
  ]);
  return {
    settings: settings.data,
    settingsI18n: settingsI18n.data ?? [],
    stats: stats.data ?? [],
    statsI18n: statsI18n.data ?? [],
    navPages: navPages.data ?? [],
    navPagesI18n: navPagesI18n.data ?? [],
  };
});

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [focus, focusI18n, projects, projectsI18n, news, newsI18n, partners, stats, statsI18n] = await Promise.all([
    sb.from("focus_areas").select("*").eq("published", true).order("sort_order"),
    sb.from("focus_areas_i18n").select("*"),
    sb.from("projects").select("*").eq("published", true).order("published_at", { ascending: false, nullsFirst: false }).limit(6),
    sb.from("projects_i18n").select("*"),
    sb.from("news").select("*").eq("published", true).order("published_at", { ascending: false }).limit(3),
    sb.from("news_i18n").select("*"),
    sb.from("partners").select("*").eq("show_on_home", true).order("sort_order"),
    sb.from("homepage_stats").select("*").eq("active", true).order("sort_order"),
    sb.from("homepage_stats_i18n").select("*"),
  ]);
  return {
    focus: focus.data ?? [],
    focusI18n: focusI18n.data ?? [],
    projects: projects.data ?? [],
    projectsI18n: projectsI18n.data ?? [],
    news: news.data ?? [],
    newsI18n: newsI18n.data ?? [],
    partners: partners.data ?? [],
    stats: stats.data ?? [],
    statsI18n: statsI18n.data ?? [],
  };
});


export const getFocusArea = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const focus = await sb.from("focus_areas").select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!focus.data) return null;
    const [i18n, projects, projectsI18n] = await Promise.all([
      sb.from("focus_areas_i18n").select("*").eq("focus_area_id", focus.data.id),
      sb.from("projects").select("*").eq("focus_area_id", focus.data.id).eq("published", true).order("published_at", { ascending: false }),
      sb.from("projects_i18n").select("*"),
    ]);
    return {
      focus: focus.data,
      i18n: i18n.data ?? [],
      projects: projects.data ?? [],
      projectsI18n: projectsI18n.data ?? [],
    };
  });

export const getProject = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const project = await sb.from("projects").select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!project.data) return null;
    const [i18n, partnerLinks, partners, tagLinks, tags, tagsI18n] = await Promise.all([
      sb.from("projects_i18n").select("*").eq("project_id", project.data.id),
      sb.from("project_partners").select("partner_id").eq("project_id", project.data.id),
      sb.from("partners").select("*"),
      sb.from("project_tags").select("tag_id").eq("project_id", project.data.id),
      sb.from("tags").select("*"),
      sb.from("tags_i18n").select("*"),
    ]);
    const partnerIds = new Set((partnerLinks.data ?? []).map((p) => p.partner_id));
    const tagIds = new Set((tagLinks.data ?? []).map((t) => t.tag_id));
    return {
      project: project.data,
      i18n: i18n.data ?? [],
      partners: (partners.data ?? []).filter((p) => partnerIds.has(p.id)),
      tags: (tags.data ?? []).filter((t) => tagIds.has(t.id)),
      tagsI18n: tagsI18n.data ?? [],
    };
  });

export const getNewsList = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [news, newsI18n] = await Promise.all([
    sb.from("news").select("*").eq("published", true).order("published_at", { ascending: false }),
    sb.from("news_i18n").select("*"),
  ]);
  return { news: news.data ?? [], newsI18n: newsI18n.data ?? [] };
});

export const getNewsArticle = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const article = await sb.from("news").select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!article.data) return null;
    const i18n = await sb.from("news_i18n").select("*").eq("news_id", article.data.id);
    return { article: article.data, i18n: i18n.data ?? [] };
  });

export const getPartners = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const r = await sb.from("partners").select("*").order("sort_order");
  return r.data ?? [];
});

export const getPage = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const page = await sb.from("pages").select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!page.data) return null;
    const i18n = await sb.from("pages_i18n").select("*").eq("page_id", page.data.id);
    return { page: page.data, i18n: i18n.data ?? [] };
  });
