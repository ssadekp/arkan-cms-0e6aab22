import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getAlbum } from "@/lib/content.functions";
import { stripHtml } from "@/lib/sanitize";
import { LightboxGallery } from "@/components/site/Lightbox";

export const Route = createFileRoute("/albums/$slug")({
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { slug } = Route.useParams();
  const { lang, t, dir } = useI18n();
  const fn = useServerFn(getAlbum);
  const { data } = useQuery({ queryKey: ["album", slug], queryFn: () => fn({ data: { slug } }) });
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (!data) return <div className="container-narrow py-16">—</div>;
  const i18n = pickI18n(data.i18n as any[], lang) as any;
  const images: string[] = Array.isArray(data.album.gallery) ? data.album.gallery : [];

  return (
    <article>
      <div className="aspect-[21/9] bg-muted overflow-hidden">
        {data.album.cover_image && (
          <img src={data.album.cover_image} alt={i18n?.title ?? slug} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="container-narrow py-12">
        <Link to="/albums" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <Back className="h-4 w-4" /> {t("nav.albums")}
        </Link>
        <h1 className="mt-4 text-4xl font-bold">{i18n?.title || data.album.slug}</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          {new Date(data.album.published_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}
        </div>
        {i18n?.description && (
          <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">{stripHtml(i18n.description)}</p>
        )}

        {images.length > 0 ? (
          <LightboxGallery images={images} className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-3" />
        ) : (
          <div className="mt-10 rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
            {lang === "ar" ? "لا توجد صور في هذا الألبوم." : "This album has no photos yet."}
          </div>
        )}
      </div>
    </article>
  );
}
