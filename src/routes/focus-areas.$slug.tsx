import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getFocusArea } from "@/lib/content.functions";

export const Route = createFileRoute("/focus-areas/$slug")({
  component: () => <SiteLayout><Body /></SiteLayout>,
  errorComponent: () => <SiteLayout><div className="container-narrow py-16">Error loading.</div></SiteLayout>,
  notFoundComponent: () => <SiteLayout><div className="container-narrow py-16">Not found.</div></SiteLayout>,
});

function Body() {
  const { slug } = Route.useParams();
  const { lang } = useI18n();
  const fn = useServerFn(getFocusArea);
  const { data } = useQuery({ queryKey: ["focus-area", slug], queryFn: () => fn({ data: { slug } }) });

  if (!data) return <div className="container-narrow py-16">—</div>;
  const i18n = pickI18n(data.i18n, lang);
  const gallery = (data.focus.gallery as string[]) ?? [];

  return (
    <article>
      <div className="aspect-[21/9] bg-muted overflow-hidden">
        {data.focus.hero_image && <img src={data.focus.hero_image} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="container-narrow py-12">
        <h1 className="text-4xl font-bold">{i18n?.title}</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed whitespace-pre-line">{i18n?.description}</p>

        {gallery.length > 0 && (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3">
            {gallery.map((g, i) => <img key={i} src={g} alt="" className="rounded-lg aspect-square object-cover" />)}
          </div>
        )}

        {data.projects.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-6">Projects</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.projects.map((p) => {
                const pi = pickI18n(data.projectsI18n.filter((x) => x.project_id === p.id), lang);
                return (
                  <Link key={p.id} to="/projects/$slug" params={{ slug: p.slug }}
                    className="rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition">
                    <div className="aspect-video bg-muted">
                      {p.hero_image && <img src={p.hero_image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold">{pi?.title}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
