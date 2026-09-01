import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { getProjectsListing } from "@/lib/content.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, LayoutGrid } from "lucide-react";
import type { MapPoint } from "@/components/site/ProjectsMapCanvas";

const MapCanvas = lazy(() => import("@/components/site/ProjectsMapCanvas"));

export const Route = createFileRoute("/projects/map")({
  head: () => ({
    meta: [
      { title: "Projects Map — Lam7et Khair Foundation" },
      { name: "description", content: "Explore Lam7et Khair Foundation projects on an interactive map, filtered by focus area and status." },
      { property: "og:title", content: "Projects Map — Lam7et Khair Foundation" },
      { property: "og:description", content: "Explore our development projects across Egypt on an interactive map." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SiteLayout>
      <Body />
    </SiteLayout>
  ),
});

const STATUS_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  planned: { ar: "مخطط", en: "Planned", color: "#f59e0b" },
  ongoing: { ar: "جارٍ", en: "Ongoing", color: "#10b981" },
  completed: { ar: "مكتمل", en: "Completed", color: "#0ea5e9" },
};

function Body() {
  const { lang } = useI18n();
  const fn = useServerFn(getProjectsListing);
  const { data } = useQuery({ queryKey: ["projects-listing"], queryFn: () => fn(), staleTime: 60_000 });

  const [focusSel, setFocusSel] = useState<string | null>(null);
  const [statusSel, setStatusSel] = useState<string | null>(null);

  const focusName = (id: string | null) => {
    if (!data || !id) return null;
    return (
      data.focusI18n.find((x: any) => x.focus_area_id === id && x.lang === lang)?.title ??
      data.focusI18n.find((x: any) => x.focus_area_id === id && x.lang === "ar")?.title ??
      null
    );
  };

  const points: MapPoint[] = useMemo(() => {
    if (!data) return [];
    return (data.projects as any[])
      .filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number")
      .filter((p) => (focusSel ? p.focus_area_id === focusSel : true))
      .filter((p) => (statusSel ? p.status === statusSel : true))
      .map((p) => {
        const i18n =
          (data.projectsI18n as any[]).find((x) => x.project_id === p.id && x.lang === lang) ??
          (data.projectsI18n as any[]).find((x) => x.project_id === p.id && x.lang === "ar");
        return {
          id: p.id,
          slug: p.slug,
          title: i18n?.title ?? p.slug,
          city: i18n?.city ?? "",
          status: p.status,
          statusLabel: STATUS_LABELS[p.status]?.[lang] ?? p.status,
          focusLabel: focusName(p.focus_area_id),
          image: p.hero_image ?? null,
          lat: p.latitude,
          lng: p.longitude,
        };
      });
  }, [data, lang, focusSel, statusSel]);

  const missing = data
    ? (data.projects as any[]).filter((p) => typeof p.latitude !== "number" || typeof p.longitude !== "number").length
    : 0;

  return (
    <div className="container-narrow py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{lang === "ar" ? "خريطة المشروعات" : "Projects map"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "ar"
              ? "استعرض مواقع مشروعاتنا على الخريطة واضغط على أي علامة لمعرفة التفاصيل."
              : "Browse where our projects happen — click any pin for details."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/projects">
            <LayoutGrid className="h-4 w-4 mr-1" />
            {lang === "ar" ? "عرض القائمة" : "List view"}
          </Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <FilterChip active={!focusSel && !statusSel} onClick={() => { setFocusSel(null); setStatusSel(null); }}>
          {lang === "ar" ? "الكل" : "All"}
        </FilterChip>
        {(data?.focus ?? []).map((f: any) => (
          <FilterChip key={f.id} active={focusSel === f.id} onClick={() => setFocusSel(focusSel === f.id ? null : f.id)}>
            {focusName(f.id) ?? f.slug}
          </FilterChip>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        {Object.entries(STATUS_LABELS).map(([key, l]) => (
          <FilterChip key={key} active={statusSel === key} onClick={() => setStatusSel(statusSel === key ? null : key)}>
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: l.color }} />
            {l[lang]}
          </FilterChip>
        ))}
      </div>

      <div className="mt-6">
        <ClientOnly
          fallback={
            <div className="h-[70vh] min-h-[420px] w-full animate-pulse rounded-2xl border border-border/60 bg-muted" />
          }
        >
          <Suspense
            fallback={
              <div className="h-[70vh] min-h-[420px] w-full animate-pulse rounded-2xl border border-border/60 bg-muted" />
            }
          >
            <MapCanvas points={points} lang={lang} />
          </Suspense>
        </ClientOnly>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Badge variant="secondary" className="gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {lang === "ar" ? `${points.length} موقع` : `${points.length} located`}
        </Badge>
        {missing > 0 && (
          <span>
            {lang === "ar"
              ? `${missing} مشروع بدون إحداثيات بعد.`
              : `${missing} project${missing === 1 ? "" : "s"} without coordinates yet.`}
          </span>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/60 bg-card hover:border-primary/60"
      }`}
    >
      {children}
    </button>
  );
}
