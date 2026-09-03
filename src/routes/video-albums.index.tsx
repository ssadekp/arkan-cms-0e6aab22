import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Play, Video } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getVideoAlbumsList } from "@/lib/content.functions";
import { stripHtml } from "@/lib/sanitize";
import { parseVideos, videoThumbnail } from "@/lib/video";

export const Route = createFileRoute("/video-albums/")({
  head: () => ({
    meta: [
      { title: "Video Albums — Lam7et Khair" },
      { name: "description", content: "Watch video collections documenting our field work, events and community initiatives." },
      { property: "og:title", content: "Video Albums — Lam7et Khair" },
      { property: "og:description", content: "Video collections from our field work, events and community initiatives." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { lang, t } = useI18n();
  const fn = useServerFn(getVideoAlbumsList);
  const { data } = useQuery({ queryKey: ["video-albums-list"], queryFn: () => fn(), staleTime: 60_000 });
  const albums = data?.albums ?? [];

  return (
    <div className="container-narrow py-16">
      <h1 className="text-3xl font-bold">{t("nav.videoAlbums")}</h1>
      <p className="mt-2 text-muted-foreground">
        {lang === "ar" ? "مجموعات فيديو من أنشطتنا ومشروعاتنا." : "Video collections from our activities and projects."}
      </p>

      {albums.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
          {lang === "ar" ? "لا توجد ألبومات فيديو بعد." : "No video albums yet."}
        </div>
      ) : (
        <div className="mt-10 grid md:grid-cols-3 gap-5">
          {albums.map((a: any) => {
            const i18n = pickI18n((data!.albumsI18n as any[]).filter((x) => x.album_id === a.id), lang) as any;
            const videos = parseVideos(a.videos);
            const cover = a.cover_image || (videos[0] ? videoThumbnail(videos[0].url) : null);
            return (
              <Link
                key={a.id}
                to="/video-albums/$slug"
                params={{ slug: a.slug }}
                className="group rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition shadow-soft"
              >
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {cover && (
                    <img
                      src={cover}
                      alt={i18n?.title ?? a.slug}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <span className="absolute inset-0 grid place-items-center bg-black/25 group-hover:bg-black/10 transition">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg">
                      <Play className="h-5 w-5 translate-x-[1px]" />
                    </span>
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="font-semibold">{i18n?.title || a.slug}</h2>
                  {i18n?.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{stripHtml(i18n.description)}</p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Video className="h-3.5 w-3.5 text-primary" />
                    {lang === "ar" ? `${videos.length} فيديو` : `${videos.length} video${videos.length === 1 ? "" : "s"}`}
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
