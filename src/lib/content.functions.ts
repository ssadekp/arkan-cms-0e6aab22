import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [settings, settingsI18n, stats, statsI18n, navPages, navPagesI18n, menuItems] = await Promise.all([
    sb.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("site_settings_i18n").select("*").eq("setting_id", 1),
    sb.from("homepage_stats").select("*").eq("active", true).order("sort_order"),
    sb.from("homepage_stats_i18n").select("*"),
    sb.from("pages").select("id, slug, show_in_nav, nav_order").eq("show_in_nav", true).eq("published", true).order("nav_order"),
    sb.from("pages_i18n").select("page_id, lang, title"),
    sb.from("menu_items" as any).select("*").eq("published", true).order("position"),
  ]);
  return {
    settings: settings.data,
    settingsI18n: settingsI18n.data ?? [],
    stats: stats.data ?? [],
    statsI18n: statsI18n.data ?? [],
    navPages: navPages.data ?? [],
    navPagesI18n: navPagesI18n.data ?? [],
    menuItems: (menuItems.data as any[]) ?? [],
  };
});

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [focus, focusI18n, projects, projectsI18n, news, newsI18n, partners, partnersI18n, stats, statsI18n] = await Promise.all([
    sb.from("focus_areas").select("*").eq("published", true).order("sort_order"),
    sb.from("focus_areas_i18n").select("*"),
    sb.from("projects").select("*").eq("published", true).order("published_at", { ascending: false, nullsFirst: false }).limit(6),
    sb.from("projects_i18n").select("*"),
    sb.from("news").select("*").eq("published", true).order("published_at", { ascending: false }).limit(3),
    sb.from("news_i18n").select("*"),
    sb.from("partners").select("*").eq("show_on_home", true).order("sort_order"),
    (sb.from("partners_i18n" as any) as any).select("*"),
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
    partnersI18n: (partnersI18n.data as any[]) ?? [],
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
    const [i18n, projects, projectsI18n, partnerLinks, partners, partnersI18n, allFocus, allFocusI18n] = await Promise.all([
      sb.from("focus_areas_i18n").select("*").eq("focus_area_id", focus.data.id),
      sb.from("projects").select("*").eq("focus_area_id", focus.data.id).eq("published", true).order("published_at", { ascending: false }),
      sb.from("projects_i18n").select("*"),
      (sb.from("focus_area_partners" as any) as any).select("partner_id").eq("focus_area_id", focus.data.id),
      sb.from("partners").select("*"),
      (sb.from("partners_i18n" as any) as any).select("*"),
      sb.from("focus_areas").select("*").eq("published", true).order("sort_order"),
      sb.from("focus_areas_i18n").select("*"),
    ]);
    const partnerIds = new Set(((partnerLinks.data ?? []) as any[]).map((p: any) => p.partner_id));
    return {
      focus: focus.data,
      i18n: i18n.data ?? [],
      projects: projects.data ?? [],
      projectsI18n: projectsI18n.data ?? [],
      partners: (partners.data ?? []).filter((p) => partnerIds.has(p.id)),
      partnersI18n: (partnersI18n.data as any[]) ?? [],
      allFocus: (allFocus.data ?? []).filter((f) => f.id !== focus.data!.id),
      allFocusI18n: allFocusI18n.data ?? [],
    };
  });


export const getProject = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const project = await sb.from("projects").select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!project.data) return null;
    const [i18n, partnerLinks, partners, partnersI18n, tagLinks, tags, tagsI18n, focus, focusI18n, allFocus, allFocusI18n, related, relatedI18n] = await Promise.all([
      sb.from("projects_i18n").select("*").eq("project_id", project.data.id),
      sb.from("project_partners").select("partner_id").eq("project_id", project.data.id),
      sb.from("partners").select("*"),
      (sb.from("partners_i18n" as any) as any).select("*"),
      sb.from("project_tags").select("tag_id").eq("project_id", project.data.id),
      sb.from("tags").select("*"),
      sb.from("tags_i18n").select("*"),
      project.data.focus_area_id
        ? sb.from("focus_areas").select("*").eq("id", project.data.focus_area_id).maybeSingle()
        : Promise.resolve({ data: null } as any),
      project.data.focus_area_id
        ? sb.from("focus_areas_i18n").select("*").eq("focus_area_id", project.data.focus_area_id)
        : Promise.resolve({ data: [] } as any),
      sb.from("focus_areas").select("*").eq("published", true).order("sort_order"),
      sb.from("focus_areas_i18n").select("*"),
      project.data.focus_area_id
        ? sb.from("projects").select("*").eq("published", true).eq("focus_area_id", project.data.focus_area_id).order("published_at", { ascending: false, nullsFirst: false }).limit(7)
        : sb.from("projects").select("*").eq("published", true).order("published_at", { ascending: false, nullsFirst: false }).limit(7),
      sb.from("projects_i18n").select("*"),
    ]);
    const partnerIds = new Set((partnerLinks.data ?? []).map((p) => p.partner_id));
    const tagIds = new Set((tagLinks.data ?? []).map((t) => t.tag_id));
    return {
      project: project.data,
      i18n: i18n.data ?? [],
      partners: (partners.data ?? []).filter((p) => partnerIds.has(p.id)),
      partnersI18n: (partnersI18n.data as any[]) ?? [],
      tags: (tags.data ?? []).filter((t) => tagIds.has(t.id)),
      tagsI18n: tagsI18n.data ?? [],
      focus: (focus as any).data ?? null,
      focusI18n: ((focusI18n as any).data ?? []) as any[],
      allFocus: allFocus.data ?? [],
      allFocusI18n: allFocusI18n.data ?? [],
      related: (related.data ?? []).filter((p) => p.id !== project.data!.id).slice(0, 6),
      relatedI18n: relatedI18n.data ?? [],
    };
  });


export const getProjectsListing = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [projects, projectsI18n, focus, focusI18n, tags, tagsI18n, partners, partnersI18n, tagLinks, partnerLinks] = await Promise.all([
    sb.from("projects").select("*").eq("published", true).order("published_at", { ascending: false, nullsFirst: false }),
    sb.from("projects_i18n").select("*"),
    sb.from("focus_areas").select("*").eq("published", true).order("sort_order"),
    sb.from("focus_areas_i18n").select("*"),
    sb.from("tags").select("*"),
    sb.from("tags_i18n").select("*"),
    sb.from("partners").select("*").order("sort_order"),
    (sb.from("partners_i18n" as any) as any).select("*"),
    sb.from("project_tags").select("*"),
    sb.from("project_partners").select("*"),
  ]);
  return {
    projects: projects.data ?? [],
    projectsI18n: projectsI18n.data ?? [],
    focus: focus.data ?? [],
    focusI18n: focusI18n.data ?? [],
    tags: tags.data ?? [],
    tagsI18n: tagsI18n.data ?? [],
    partners: partners.data ?? [],
    partnersI18n: (partnersI18n.data as any[]) ?? [],
    tagLinks: tagLinks.data ?? [],
    partnerLinks: partnerLinks.data ?? [],
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
    const [i18n, latest, latestI18n] = await Promise.all([
      sb.from("news_i18n").select("*").eq("news_id", article.data.id),
      sb.from("news").select("*").eq("published", true).order("published_at", { ascending: false }).limit(30),
      sb.from("news_i18n").select("*"),
    ]);
    return {
      article: article.data,
      i18n: i18n.data ?? [],
      latest: (latest.data ?? []).filter((n) => n.id !== article.data!.id),
      latestI18n: latestI18n.data ?? [],
    };
  });

export const getTeamMember = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const member = await (sb.from("team_members" as any) as any)
      .select("*").eq("id", data.id).eq("published", true).maybeSingle();
    if (!member.data) return null;
    const i18n = await (sb.from("team_members_i18n" as any) as any).select("*").eq("member_id", data.id);
    return { member: member.data as any, i18n: (i18n.data as any[]) ?? [] };
  });


export const getAlbumsList = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [albums, albumsI18n] = await Promise.all([
    (sb.from("albums" as any) as any).select("*").eq("published", true).order("published_at", { ascending: false }),
    (sb.from("albums_i18n" as any) as any).select("*"),
  ]);
  return { albums: (albums.data as any[]) ?? [], albumsI18n: (albumsI18n.data as any[]) ?? [] };
});

export const getAlbum = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const album = await (sb.from("albums" as any) as any)
      .select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!album.data) return null;
    const i18n = await (sb.from("albums_i18n" as any) as any).select("*").eq("album_id", album.data.id);
    return { album: album.data, i18n: (i18n.data as any[]) ?? [] };
  });

export const getPartners = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [r, i] = await Promise.all([
    sb.from("partners").select("*").order("sort_order"),
    (sb.from("partners_i18n" as any) as any).select("*"),
  ]);
  return { partners: r.data ?? [], partnersI18n: (i.data as any[]) ?? [] };
});

export const getAboutExtras = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [values, valuesI18n, team, teamI18n] = await Promise.all([
    (sb.from("about_values" as any) as any).select("*").eq("published", true).order("sort_order"),
    (sb.from("about_values_i18n" as any) as any).select("*"),
    (sb.from("team_members" as any) as any).select("*").eq("published", true).order("sort_order"),
    (sb.from("team_members_i18n" as any) as any).select("*"),
  ]);
  return {
    values: (values.data as any[]) ?? [],
    valuesI18n: (valuesI18n.data as any[]) ?? [],
    team: (team.data as any[]) ?? [],
    teamI18n: (teamI18n.data as any[]) ?? [],
  };
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

export const submitContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    subject: z.string().trim().max(200).optional().nullable(),
    message: z.string().trim().min(1).max(2000),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { error } = await sb.from("contact_messages").insert({
      name: data.name, email: data.email,
      subject: data.subject ?? null, message: data.message,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getArticlesList = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [articles, articlesI18n] = await Promise.all([
    (sb.from("articles" as any) as any).select("*").eq("published", true).order("published_at", { ascending: false }),
    (sb.from("articles_i18n" as any) as any).select("*"),
  ]);
  return { articles: (articles.data as any[]) ?? [], articlesI18n: (articlesI18n.data as any[]) ?? [] };
});

export const getArticle = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const article = await (sb.from("articles" as any) as any)
      .select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!article.data) return null;
    const [i18n, latest, latestI18n] = await Promise.all([
      (sb.from("articles_i18n" as any) as any).select("*").eq("article_id", article.data.id),
      (sb.from("articles" as any) as any).select("*").eq("published", true).order("published_at", { ascending: false }).limit(30),
      (sb.from("articles_i18n" as any) as any).select("*"),
    ]);
    return {
      article: article.data as any,
      i18n: (i18n.data as any[]) ?? [],
      latest: ((latest.data as any[]) ?? []).filter((n: any) => n.id !== article.data.id),
      latestI18n: (latestI18n.data as any[]) ?? [],
    };
  });

export const getVideoAlbumsList = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [albums, albumsI18n] = await Promise.all([
    (sb.from("video_albums" as any) as any).select("*").eq("published", true).order("published_at", { ascending: false }),
    (sb.from("video_albums_i18n" as any) as any).select("*"),
  ]);
  return { albums: (albums.data as any[]) ?? [], albumsI18n: (albumsI18n.data as any[]) ?? [] };
});

export const getVideoAlbum = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const album = await (sb.from("video_albums" as any) as any)
      .select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!album.data) return null;
    const i18n = await (sb.from("video_albums_i18n" as any) as any).select("*").eq("album_id", album.data.id);
    return { album: album.data as any, i18n: (i18n.data as any[]) ?? [] };
  });
