import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getProject } from "@/lib/content.functions";
import { sanitizeHtml } from "@/lib/sanitize";
import { LightboxGallery } from "@/components/site/Lightbox";
import { SidebarCard, SidebarList } from "@/components/site/DetailSidebar";

export const Route = createFileRoute("/projects/$slug")({
  component: () => <SiteLayout><Body /></SiteLayout>,
});

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  planned:   { ar: "مخطط",  en: "Planned" },
  ongoing:   { ar: "جارٍ",   en: "Ongoing" },
  completed: { ar: "مكتمل", en: "Completed" },
};

function Body() {
  const { slug } = Route.useParams();
  const { lang } = useI18n();
  const fn = useServerFn(getProject);
  const { data } = useQuery({ queryKey: ["project", slug], queryFn: () => fn({ data: { slug } }) });
  if (!data) return <div className="container-narrow py-16">—</div>;
  const i18n = pickI18n(data.i18n, lang);
  const gallery = (data.project.gallery as string[]) ?? [];
  const status = STATUS_LABELS[(data.project as any).status]?.[lang];
  const tagName = (id: string) =>
    (data.tagsI18n as any[]).find((x) => x.tag_id === id && x.lang === lang)?.name
    ?? (data.tagsI18n as any[]).find((x) => x.tag_id === id)?.name
    ?? "";
  const focusName = data.focus
    ? (data.focusI18n as any[]).find((x) => x.lang === lang)?.title
      ?? (data.focusI18n as any[]).find((x) => x.lang === "ar")?.title
      ?? (data.focus as any).slug
    : null;

  const axes = ((data as any).allFocus ?? []).map((f: any) => ({
    key: f.slug,
    label:
      ((data as any).allFocusI18n ?? []).find((x: any) => x.focus_area_id === f.id && x.lang === lang)?.title ||
      ((data as any).allFocusI18n ?? []).find((x: any) => x.focus_area_id === f.id && x.lang === "ar")?.title ||
      f.slug,
    image: f.hero_image ?? f.icon ?? null,
    meta: (data.focus as any)?.id === f.id ? (lang === "ar" ? "المجال الحالي" : "Current area") : null,
  }));

  const related = ((data as any).related ?? []).map((p: any) => ({
    key: p.slug,
    label:
      ((data as any).relatedI18n ?? []).find((x: any) => x.project_id === p.id && x.lang === lang)?.title ||
      ((data as any).relatedI18n ?? []).find((x: any) => x.project_id === p.id && x.lang === "ar")?.title ||
      p.slug,
    image: p.hero_image ?? null,
  }));

  return (
    <article>
      <div className="aspect-[21/9] bg-muted overflow-hidden">
        {data.project.hero_image && <img src={data.project.hero_image} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="container-narrow py-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_310px] items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {focusName && (
              <span className="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                {focusName}
              </span>
            )}
            {status && (
              <span className="inline-block rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
                {status}
              </span>
            )}
            {(data.tags ?? []).map((t: any) => (
              <span key={t.id} className="inline-block rounded-full bg-muted px-3 py-1 text-xs">
                {tagName(t.id)}
              </span>
            ))}
          </div>
          <h1 className="text-4xl font-bold">{i18n?.title}</h1>
          <div
            className="prose prose-sm sm:prose-base max-w-none mt-6 text-muted-foreground dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml((i18n as any)?.description ?? "") }}
          />

          {gallery.length > 0 && (
            <LightboxGallery
              images={gallery}
              className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3"
            />
          )}

          {data.partners.length > 0 && (
            <div className="mt-12">
              <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">{lang === "ar" ? "الجمعيات والمؤسسات المشاركة" : "Partners"}</h3>
              <div className="flex flex-wrap gap-3">
                {data.partners.map((p: any) => {
                  const name = (data as any).partnersI18n?.find((x: any) => x.partner_id === p.id && x.lang === lang)?.name
                    || (data as any).partnersI18n?.find((x: any) => x.partner_id === p.id && x.lang === "ar")?.name
                    || p.name;
                  return (
                    <a key={p.id} href={p.website_url ?? "#"} target="_blank" rel="noreferrer"
                       className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/60 hover:border-primary/60">
                      {p.logo_url && <img src={p.logo_url} alt="" className="h-6 w-6 object-contain" />}
                      <span className="text-sm">{name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          {axes.length > 0 && (
            <SidebarCard title={lang === "ar" ? "مجالات العمل" : "Focus areas"}>
              <SidebarList items={axes} to="/focus-areas/$slug" />
            </SidebarCard>
          )}
          {related.length > 0 && (
            <SidebarCard title={lang === "ar" ? "مشروعات أخرى" : "Other projects"}>
              <SidebarList items={related} to="/projects/$slug" />
            </SidebarCard>
          )}
          <Link to="/projects" className="block text-center text-sm font-semibold text-primary hover:underline">
            {lang === "ar" ? "كل المشروعات" : "All projects"}
          </Link>
        </aside>
      </div>
    </article>
  );
}
