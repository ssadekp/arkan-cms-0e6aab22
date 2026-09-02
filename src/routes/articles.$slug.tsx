import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getArticle } from "@/lib/content.functions";
import { sanitizeHtml } from "@/lib/sanitize";
import { LightboxGallery } from "@/components/site/Lightbox";
import { SidebarCard, SidebarList } from "@/components/site/DetailSidebar";
import { Input } from "@/components/ui/input";
import { ShareButtons } from "@/components/site/ShareButtons";

export const Route = createFileRoute("/articles/$slug")({
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { slug } = Route.useParams();
  const { lang } = useI18n();
  const fn = useServerFn(getArticle);
  const { data } = useQuery({ queryKey: ["article", slug], queryFn: () => fn({ data: { slug } }) });
  const [q, setQ] = useState("");

  const latest = useMemo(() => {
    const rows = ((data as any)?.latest ?? []) as any[];
    const i18nRows = ((data as any)?.latestI18n ?? []) as any[];
    return rows
      .map((n) => ({
        key: n.slug,
        label:
          i18nRows.find((x) => x.article_id === n.id && x.lang === lang)?.title ||
          i18nRows.find((x) => x.article_id === n.id && x.lang === "ar")?.title ||
          n.slug,
        image: n.hero_image ?? null,
        meta: n.published_at
          ? new Date(n.published_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")
          : null,
      }))
      .filter((n) => n.label.toLowerCase().includes(q.trim().toLowerCase()))
      .slice(0, 8);
  }, [data, lang, q]);

  if (!data) return <div className="container-narrow py-16">—</div>;
  const i18n = pickI18n(data.i18n as any[], lang);
  const gallery = ((data.article as any).gallery as string[]) ?? [];

  return (
    <article>
      <div className="aspect-[21/9] bg-muted overflow-hidden">
        {(data.article as any).hero_image && (
          <img src={(data.article as any).hero_image} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="container-narrow py-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_310px] items-start">
        <div className="min-w-0 max-w-3xl">
          <div className="text-sm text-muted-foreground">
            {new Date((data.article as any).published_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
          </div>
          <h1 className="mt-2 text-4xl font-bold">{(i18n as any)?.title}</h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{(i18n as any)?.description}</p>
          {(i18n as any)?.body && (
            <div
              className="prose prose-sm sm:prose-base max-w-none mt-6 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml((i18n as any).body) }}
            />
          )}
          <ShareButtons title={(i18n as any)?.title ?? ""} className="mt-8" />

          {gallery.length > 0 && (
            <LightboxGallery images={gallery} className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3" />
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "ar" ? "ابحث في المقالات…" : "Search articles…"}
              aria-label={lang === "ar" ? "ابحث في المقالات" : "Search articles"}
              className="ps-9"
            />
          </div>
          <SidebarCard title={lang === "ar" ? "أحدث المقالات" : "Latest articles"}>
            <SidebarList items={latest} to="/articles/$slug" />
          </SidebarCard>
          <Link to="/articles" className="block text-center text-sm font-semibold text-primary hover:underline">
            {lang === "ar" ? "كل المقالات" : "All articles"}
          </Link>
        </aside>
      </div>
    </article>
  );
}
