import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { ShareButtons } from "@/components/site/ShareButtons";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getVideoAlbum } from "@/lib/content.functions";
import { stripHtml } from "@/lib/sanitize";
import { embedUrl, parseVideos, videoProvider, videoThumbnail } from "@/lib/video";

export const Route = createFileRoute("/video-albums/$slug")({
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { slug } = Route.useParams();
  const { lang, t, dir } = useI18n();
  const fn = useServerFn(getVideoAlbum);
  const { data } = useQuery({ queryKey: ["video-album", slug], queryFn: () => fn({ data: { slug } }) });
  const [active, setActive] = useState(0);
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (!data) return <div className="container-narrow py-16">—</div>;
  const i18n = pickI18n(data.i18n as any[], lang) as any;
  const videos = parseVideos(data.album.videos);
  const current = videos[active];
  const src = current ? embedUrl(current.url) : null;
  const titleOf = (v: any) => (lang === "ar" ? v.title || v.title_en : v.title_en || v.title) || "";

  return (
    <article className="container-narrow py-12">
      <Link to="/video-albums" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <Back className="h-4 w-4" /> {t("nav.videoAlbums")}
      </Link>
      <h1 className="mt-4 text-4xl font-bold">{i18n?.title || data.album.slug}</h1>
      <div className="mt-2 text-sm text-muted-foreground">
        {new Date(data.album.published_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
      </div>
      {i18n?.description && (
        <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">{stripHtml(i18n.description)}</p>
      )}

      <ShareButtons title={i18n?.title ?? data.album.slug} className="mt-6" />

      {videos.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
          {lang === "ar" ? "لا توجد مقاطع في هذا الألبوم." : "This album has no videos yet."}
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              {src ? (
                videoProvider(current.url) === "file" ? (
                  <video src={src} controls playsInline className="h-full w-full" />
                ) : (
                  <iframe
                    key={src}
                    src={src}
                    title={titleOf(current) || (i18n?.title ?? data.album.slug)}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                )
              ) : (
                <div className="grid h-full place-items-center text-sm text-white/70">
                  {lang === "ar" ? "رابط الفيديو غير مدعوم." : "Unsupported video link."}
                </div>
              )}
            </div>
            {titleOf(current) && <h2 className="mt-3 text-lg font-semibold">{titleOf(current)}</h2>}
          </div>

          <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto">
            {videos.map((v, i) => {
              const thumb = videoThumbnail(v.url) || data.album.cover_image;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  className={`flex w-full items-center gap-3 rounded-lg border p-2 text-start transition ${
                    i === active ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/60"
                  }`}
                >
                  <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-muted">
                    {thumb && <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />}
                    <span className="absolute inset-0 grid place-items-center bg-black/25">
                      <Play className="h-4 w-4 text-white" />
                    </span>
                  </span>
                  <span className="text-sm font-medium line-clamp-2">
                    {titleOf(v) || (lang === "ar" ? `فيديو ${i + 1}` : `Video ${i + 1}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
}
