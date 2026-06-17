import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getProject } from "@/lib/content.functions";
import { sanitizeHtml } from "@/lib/sanitize";
import { LightboxGallery } from "@/components/site/Lightbox";

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

  return (
    <article>
      <div className="aspect-[21/9] bg-muted overflow-hidden">
        {data.project.hero_image && <img src={data.project.hero_image} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="container-narrow py-12">
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
          dangerouslySetInnerHTML={{ __html: (i18n as any)?.description ?? "" }}
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
    </article>
  );
}
