import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Images } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getAlbumsList } from "@/lib/content.functions";
import { stripHtml } from "@/lib/sanitize";

export const Route = createFileRoute("/albums/")({
  head: () => ({
    meta: [
      { title: "Photo Albums — Lam7et Khair" },
      { name: "description", content: "Browse photo albums documenting our field work, events and community projects." },
      { property: "og:title", content: "Photo Albums — Lam7et Khair" },
      { property: "og:description", content: "Photo albums from our field work, events and community projects." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { lang, t } = useI18n();
  const fn = useServerFn(getAlbumsList);
  const { data } = useQuery({ queryKey: ["albums-list"], queryFn: () => fn(), staleTime: 60_000 });
  const albums = data?.albums ?? [];

  return (
    <div className="container-narrow py-16">
      <h1 className="text-3xl font-bold">{t("nav.albums")}</h1>
      <p className="mt-2 text-muted-foreground">
        {lang === "ar" ? "مجموعات صور من أنشطتنا ومشروعاتنا." : "Photo collections from our activities and projects."}
      </p>

      {albums.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
          {lang === "ar" ? "لا توجد ألبومات بعد." : "No albums yet."}
        </div>
      ) : (
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {albums.map((a: any) => {
            const i18n = pickI18n((data!.albumsI18n as any[]).filter((x) => x.album_id === a.id), lang) as any;
            const count = Array.isArray(a.gallery) ? a.gallery.length : 0;
            return (
              <Link
                key={a.id}
                to="/albums/$slug"
                params={{ slug: a.slug }}
                className="group rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition shadow-soft"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  {a.cover_image && (
                    <img
                      src={a.cover_image}
                      alt={i18n?.title ?? a.slug}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                </div>
                <div className="p-5">
                  <h2 className="font-semibold">{i18n?.title || a.slug}</h2>
                  {i18n?.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{stripHtml(i18n.description)}</p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Images className="h-3.5 w-3.5 text-primary" />
                    {lang === "ar" ? `${count} صورة` : `${count} photo${count === 1 ? "" : "s"}`}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
