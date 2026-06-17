import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getPage } from "@/lib/content.functions";
import { sanitizeHtml } from "@/lib/sanitize";

export const Route = createFileRoute("/p/$slug")({
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { slug } = Route.useParams();
  const { lang } = useI18n();
  const fn = useServerFn(getPage);
  const { data } = useQuery({ queryKey: ["page", slug], queryFn: () => fn({ data: { slug } }) });
  if (!data) return <div className="container-narrow py-16">—</div>;
  const i = pickI18n(data.i18n, lang);
  return (
    <article>
      {data.page.hero_image && (
        <div className="aspect-[21/9] bg-muted overflow-hidden">
          <img src={data.page.hero_image} alt="" className="h-full w-full object-cover" />
        </div>
      )}
      <div className="container-narrow py-12 max-w-3xl">
        <h1 className="text-4xl font-bold">{i?.title}</h1>
        <div
          className="prose prose-sm sm:prose-base max-w-none mt-6 text-muted-foreground dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: i?.body ?? "" }}
        />
      </div>
    </article>
  );
}
