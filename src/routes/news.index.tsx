import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getNewsList } from "@/lib/content.functions";

export const Route = createFileRoute("/news/")({
  head: () => ({ meta: [{ title: "News — Lam7et Khair" }] }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { lang, t } = useI18n();
  const fn = useServerFn(getNewsList);
  const { data } = useQuery({ queryKey: ["news-list"], queryFn: () => fn(), staleTime: 60_000 });
  return (
    <div className="container-narrow py-16">
      <h1 className="text-3xl font-bold mb-8">{t("nav.news")}</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(data?.news ?? []).map((n) => {
          const i = pickI18n((data!.newsI18n).filter((x) => x.news_id === n.id), lang);
          return (
            <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }}
              className="rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition">
              <div className="aspect-video bg-muted">
                {n.hero_image && <img src={n.hero_image} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="p-5">
                <div className="text-xs text-muted-foreground">{new Date(n.published_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}</div>
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
