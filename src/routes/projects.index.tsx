import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getHomeData } from "@/lib/content.functions";

export const Route = createFileRoute("/projects/")({
  head: () => ({ meta: [{ title: "Projects — Lam7et Khair" }] }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { lang, t } = useI18n();
  const fn = useServerFn(getHomeData);
  const { data } = useQuery({ queryKey: ["home-data"], queryFn: () => fn(), staleTime: 60_000 });
  return (
    <div className="container-narrow py-16">
      <h1 className="text-3xl font-bold mb-8">{t("nav.projects")}</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(data?.projects ?? []).map((p) => {
          const i = pickI18n(data!.projectsI18n.filter((x) => x.project_id === p.id), lang);
          return (
            <Link key={p.id} to="/projects/$slug" params={{ slug: p.slug }}
              className="rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition">
              <div className="aspect-video bg-muted">
                {p.hero_image && <img src={p.hero_image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="p-5">
                <h3 className="font-semibold">{i?.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{i?.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
