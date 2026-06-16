import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getNewsArticle } from "@/lib/content.functions";
import { LightboxGallery } from "@/components/site/Lightbox";

export const Route = createFileRoute("/news/$slug")({
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { slug } = Route.useParams();
  const { lang } = useI18n();
  const fn = useServerFn(getNewsArticle);
  const { data } = useQuery({ queryKey: ["news", slug], queryFn: () => fn({ data: { slug } }) });
  if (!data) return <div className="container-narrow py-16">—</div>;
  const i18n = pickI18n(data.i18n, lang);
  const gallery = (data.article.gallery as string[]) ?? [];
  return (
    <article>
      <div className="aspect-[21/9] bg-muted overflow-hidden">
        {data.article.hero_image && <img src={data.article.hero_image} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="container-narrow py-12 max-w-3xl">
        <div className="text-sm text-muted-foreground">{new Date(data.article.published_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}</div>
        <h1 className="mt-2 text-4xl font-bold">{i18n?.title}</h1>
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{i18n?.description}</p>
        {i18n?.body && (
          <div
            className="prose prose-sm sm:prose-base max-w-none mt-6 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: i18n.body }}
          />
        )}
        {gallery.length > 0 && (
          <LightboxGallery
            images={gallery}
            className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3"
          />
        )}
      </div>
    </article>
  );
}
