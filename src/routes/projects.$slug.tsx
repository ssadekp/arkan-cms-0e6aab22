import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getProject } from "@/lib/content.functions";

export const Route = createFileRoute("/projects/$slug")({
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { slug } = Route.useParams();
  const { lang } = useI18n();
  const fn = useServerFn(getProject);
  const { data } = useQuery({ queryKey: ["project", slug], queryFn: () => fn({ data: { slug } }) });
  if (!data) return <div className="container-narrow py-16">—</div>;
  const i18n = pickI18n(data.i18n, lang);
  const gallery = (data.project.gallery as string[]) ?? [];

  return (
    <article>
      <div className="aspect-[21/9] bg-muted overflow-hidden">
        {data.project.hero_image && <img src={data.project.hero_image} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="container-narrow py-12">
        <h1 className="text-4xl font-bold">{i18n?.title}</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{i18n?.description}</p>

        {gallery.length > 0 && (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((g, i) => <img key={i} src={g} alt="" className="rounded-lg aspect-square object-cover" />)}
          </div>
        )}

        {data.partners.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">Partners</h3>
            <div className="flex flex-wrap gap-3">
              {data.partners.map((p) => (
                <a key={p.id} href={p.website_url ?? "#"} target="_blank" rel="noreferrer"
                   className="flex items-center gap-2 px-3 py-2 rounded-md border border-border/60 hover:border-primary/60">
                  {p.logo_url && <img src={p.logo_url} alt="" className="h-6 w-6 object-contain" />}
                  <span className="text-sm">{p.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
