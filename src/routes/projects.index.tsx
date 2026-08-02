import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getProjectsListing } from "@/lib/content.functions";
import { stripHtml } from "@/lib/sanitize";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "lucide-react";

export const Route = createFileRoute("/projects/")({
  head: () => ({ meta: [{ title: "Projects — Lam7et Khair" }] }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  planned: { ar: "مخطط", en: "Planned" },
  ongoing: { ar: "جارٍ", en: "Ongoing" },
  completed: { ar: "مكتمل", en: "Completed" },
};

function Body() {
  const { lang, t } = useI18n();
  const fn = useServerFn(getProjectsListing);
  const { data } = useQuery({ queryKey: ["projects-listing"], queryFn: () => fn(), staleTime: 60_000 });

  const [focusSel, setFocusSel] = useState<string[]>([]);
  const [statusSel, setStatusSel] = useState<string[]>([]);
  const [tagSel, setTagSel] = useState<string[]>([]);
  const [partnerSel, setPartnerSel] = useState<string[]>([]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.projects.filter((p: any) => {
      if (focusSel.length && !focusSel.includes(p.focus_area_id)) return false;
      if (statusSel.length && !statusSel.includes(p.status)) return false;
      if (tagSel.length) {
        const pTags = data.tagLinks.filter((l: any) => l.project_id === p.id).map((l: any) => l.tag_id);
        if (!tagSel.some((t) => pTags.includes(t))) return false;
      }
      if (partnerSel.length) {
        const pParts = data.partnerLinks.filter((l: any) => l.project_id === p.id).map((l: any) => l.partner_id);
        if (!partnerSel.some((id) => pParts.includes(id))) return false;
      }
      return true;
    });
  }, [data, focusSel, statusSel, tagSel, partnerSel]);

  const activeCount = focusSel.length + statusSel.length + tagSel.length + partnerSel.length;
  const clearAll = () => { setFocusSel([]); setStatusSel([]); setTagSel([]); setPartnerSel([]); };

  const filters = data ? (
    <div className="space-y-6">
      <FilterGroup
        title={lang === "ar" ? "مجال العمل" : "Focus area"}
        items={data.focus.map((f: any) => ({
          id: f.id,
          label: data.focusI18n.find((x: any) => x.focus_area_id === f.id && x.lang === lang)?.title
            ?? data.focusI18n.find((x: any) => x.focus_area_id === f.id && x.lang === "ar")?.title
            ?? f.slug,
        }))}
        selected={focusSel}
        single
        onToggle={(id) => setFocusSel((s) => s.includes(id) ? [] : [id])}
      />
      <FilterGroup
        title={lang === "ar" ? "الحالة" : "Status"}
        items={Object.entries(STATUS_LABELS).map(([id, l]) => ({ id, label: l[lang] }))}
        selected={statusSel}
        onToggle={(id) => setStatusSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])}
      />
      <FilterGroup
        title={lang === "ar" ? "الوسوم" : "Tags"}
        items={data.tags.map((tg: any) => ({
          id: tg.id,
          label: data.tagsI18n.find((x: any) => x.tag_id === tg.id && x.lang === lang)?.name
            ?? data.tagsI18n.find((x: any) => x.tag_id === tg.id && x.lang === "ar")?.name
            ?? tg.slug,
        }))}
        selected={tagSel}
        onToggle={(id) => setTagSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])}
      />
      <FilterGroup
        title={lang === "ar" ? "الشركاء" : "Partners"}
        items={data.partners.map((pt: any) => ({
          id: pt.id,
          label: data.partnersI18n.find((x: any) => x.partner_id === pt.id && x.lang === lang)?.name
            ?? data.partnersI18n.find((x: any) => x.partner_id === pt.id && x.lang === "ar")?.name
            ?? pt.name ?? "",
        }))}
        selected={partnerSel}
        onToggle={(id) => setPartnerSel((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])}
      />
      {activeCount > 0 && (
        <Button variant="outline" size="sm" onClick={clearAll} className="w-full">
          <X className="h-4 w-4 mr-1" />
          {lang === "ar" ? "مسح الفلاتر" : "Clear filters"}
        </Button>
      )}
    </div>
  ) : null;

  return (
    <div className="container-narrow py-16">
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">{t("nav.projects")}</h1>
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                {lang === "ar" ? "فلاتر" : "Filters"}
                {activeCount > 0 && <Badge variant="secondary" className="ml-2">{activeCount}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side={lang === "ar" ? "right" : "left"} className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{lang === "ar" ? "فلاتر" : "Filters"}</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{filters}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border/60 bg-card p-5">
            {filters}
          </div>
        </aside>

        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {lang === "ar" ? `${filtered.length} مشروع` : `${filtered.length} project${filtered.length === 1 ? "" : "s"}`}
          </p>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-muted-foreground">
              {lang === "ar" ? "لا توجد مشاريع مطابقة." : "No matching projects."}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p: any) => {
                const i = pickI18n((data!.projectsI18n).filter((x: any) => x.project_id === p.id), lang);
                return (
                  <Link key={p.id} to="/projects/$slug" params={{ slug: p.slug }}
                    className="rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition flex flex-col">
                    <div className="aspect-video bg-muted">
                      {p.hero_image && <img src={p.hero_image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-semibold">{i?.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">{stripHtml(i?.description)}</p>
                      {p.status && (
                        <Badge variant="secondary" className="mt-3 self-start">
                          {STATUS_LABELS[p.status]?.[lang] ?? p.status}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title, items, selected, onToggle, single,
}: {
  title: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  single?: boolean;
}) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {items.map((it) => {
          const checked = selected.includes(it.id);
          return (
            <label key={it.id} className="flex items-center gap-2 text-sm cursor-pointer">
              {single ? (
                <span
                  role="radio"
                  aria-checked={checked}
                  onClick={() => onToggle(it.id)}
                  className={`grid place-content-center h-4 w-4 shrink-0 rounded-full border border-primary ${checked ? "bg-primary" : ""}`}
                >
                  {checked && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                </span>
              ) : (
                <Checkbox checked={checked} onCheckedChange={() => onToggle(it.id)} />
              )}
              <span className="flex-1">{it.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
