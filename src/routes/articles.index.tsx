import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getArticlesList } from "@/lib/content.functions";

export const Route = createFileRoute("/articles/")({
  head: () => ({
    meta: [
      { title: "Articles — Lam7et Khair" },
      { name: "description", content: "Articles, insights and stories from our team, in Arabic and English." },
      { property: "og:title", content: "Articles — Lam7et Khair" },
      { property: "og:description", content: "Articles, insights and stories from our team, in Arabic and English." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { lang, t } = useI18n();
  const fn = useServerFn(getArticlesList);
  const { data } = useQuery({ queryKey: ["articles-list"], queryFn: () => fn(), staleTime: 60_000 });
  return (
    <div className="container-narrow py-16">
      <h1 className="text-3xl font-bold mb-8">{t("nav.articles")}</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(data?.articles ?? []).map((a: any) => {
          const i = pickI18n((data!.articlesI18n as any[]).filter((x: any) => x.article_id === a.id), lang);
          return (
            <Link key={a.id} to="/articles/$slug" params={{ slug: a.slug }}
              className="rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition">
              <div className="aspect-video bg-muted">
                {a.hero_image && <img src={a.hero_image} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </div>
              <div className="p-5">
                <div className="text-xs text-muted-foreground">
                  {new Date(a.published_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
                </div>
                <h3 className="mt-1 font-semibold">{i?.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{i?.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
