import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as Lucide from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getSiteData, getHomeData, getAboutExtras } from "@/lib/content.functions";
import { sanitizeHtml } from "@/lib/sanitize";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Mission, Vision & Team" },
      { name: "description", content: "Learn about our foundation: our mission, vision, values and the team behind our community work." },
      { property: "og:title", content: "About Us — Mission, Vision & Team" },
      { property: "og:description", content: "Our mission, vision, values and the team behind our community work." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <SiteLayout><AboutBody /></SiteLayout>,
});

function LucideIcon({ name, className }: { name?: string | null; className?: string }) {
  if (!name) return null;
  const key = name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join("");
  const Cmp = (Lucide as any)[key] ?? (Lucide as any)[name];
  if (!Cmp) return null;
  return <Cmp className={className} aria-hidden="true" />;
}

function AboutBody() {
  const { lang, t } = useI18n();
  const siteFn = useServerFn(getSiteData);
  const homeFn = useServerFn(getHomeData);
  const extrasFn = useServerFn(getAboutExtras);
  const { data: site } = useQuery({ queryKey: ["site-data"], queryFn: () => siteFn(), staleTime: 60_000 });
  const { data: home } = useQuery({ queryKey: ["home-data"], queryFn: () => homeFn(), staleTime: 60_000 });
  const { data: extras } = useQuery({ queryKey: ["about-extras"], queryFn: () => extrasFn(), staleTime: 60_000 });
  const i18n = pickI18n(site?.settingsI18n, lang) as any;

  return (
    <div className="container-narrow py-16">
      <h1 className="text-4xl font-bold">{i18n?.about_title || i18n?.site_name}</h1>
      <p className="mt-2 text-lg text-primary">{i18n?.tagline}</p>
      {(site?.settings as any)?.about_image && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border/60 aspect-[16/9] bg-muted">
          <img
            src={(site!.settings as any).about_image}
            alt={i18n?.about_title || i18n?.site_name || "About us"}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      {i18n?.about_short && (
        <div className="mt-8 prose prose-neutral dark:prose-invert max-w-3xl" dangerouslySetInnerHTML={{ __html: sanitizeHtml(i18n.about_short) }} />
      )}
      {i18n?.about_body && (
        <div className="mt-6 prose prose-neutral dark:prose-invert max-w-3xl" dangerouslySetInnerHTML={{ __html: sanitizeHtml(i18n.about_body) }} />
      )}

      {(extras?.values?.length ?? 0) > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold">{t("about.values")}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {extras!.values.map((v: any) => {
              const tr = pickI18n(extras!.valuesI18n.filter((x: any) => x.value_id === v.id), lang) as any;
              return (
                <article key={v.id} className="rounded-2xl border border-border/60 bg-card p-6">
                  {v.image ? (
                    <img src={v.image} alt={tr?.title || ""} className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <LucideIcon name={v.icon} className="h-7 w-7" />
                    </div>
                  )}
                  <h3 className="mt-4 text-lg font-semibold">{tr?.title}</h3>
                  {tr?.description && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{tr.description}</p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {(extras?.team?.length ?? 0) > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold">{t("about.team")}</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {extras!.team.map((m: any) => {
              const tr = pickI18n(extras!.teamI18n.filter((x: any) => x.member_id === m.id), lang) as any;
              return (
                <Link
                  key={m.id}
                  to="/team/$id"
                  params={{ id: m.id }}
                  className="block overflow-hidden rounded-2xl border border-border/60 bg-card text-center transition hover:border-primary/60 hover:shadow-lg"
                >
                  <div className="aspect-square w-full bg-muted">
                    {m.photo && (
                      <img src={m.photo} alt={tr?.name || "Team member"} loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold">{tr?.name}</h3>
                    {tr?.position && (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">{tr.position}</p>
                    )}
                    {tr?.role && (
                      <p className="mt-1 text-xs font-medium text-foreground/70">{tr.role}</p>
                    )}

                    {tr?.description && (
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-3">{tr.description}</p>
                    )}
                    <span className="mt-3 inline-block text-xs font-semibold text-primary">
                      {lang === "ar" ? "عرض الملف" : "View profile"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {(home?.stats?.length ?? 0) > 0 && (
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
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

