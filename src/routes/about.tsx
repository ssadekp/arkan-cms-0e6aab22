import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getSiteData, getHomeData } from "@/lib/content.functions";
import { sanitizeHtml } from "@/lib/sanitize";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About — Lam7et Khair" }, { name: "description", content: "About our foundation." }] }),
  component: () => <SiteLayout><AboutBody /></SiteLayout>,
});

function AboutBody() {
  const { lang } = useI18n();
  const siteFn = useServerFn(getSiteData);
  const homeFn = useServerFn(getHomeData);
  const { data: site } = useQuery({ queryKey: ["site-data"], queryFn: () => siteFn(), staleTime: 60_000 });
  const { data: home } = useQuery({ queryKey: ["home-data"], queryFn: () => homeFn(), staleTime: 60_000 });
  const i18n = pickI18n(site?.settingsI18n, lang) as any;
  return (
    <div className="container-narrow py-16">
      <h1 className="text-4xl font-bold">{i18n?.about_title || i18n?.site_name}</h1>
      <p className="mt-2 text-lg text-primary">{i18n?.tagline}</p>
      {i18n?.about_short && (
        <div className="mt-8 prose prose-neutral dark:prose-invert max-w-3xl" dangerouslySetInnerHTML={{ __html: sanitizeHtml(i18n.about_short) }} />
      )}
      {i18n?.about_body && (
        <div className="mt-6 prose prose-neutral dark:prose-invert max-w-3xl" dangerouslySetInnerHTML={{ __html: sanitizeHtml(i18n.about_body) }} />
      )}

      {(home?.stats?.length ?? 0) > 0 && (
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {home!.stats.map((s) => {
            const label = pickI18n(home!.statsI18n.filter((x) => x.stat_id === s.id), lang)?.label;
            return (
              <div key={s.id} className="rounded-xl border border-border/60 bg-card p-6 text-center">
                <div className="text-3xl font-bold text-primary">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{label}</div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
