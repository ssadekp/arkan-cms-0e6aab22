import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAll, saveSiteSettings } from "@/lib/admin.functions";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { mergeHomepageI18n } from "@/lib/settings-merge";

export const Route = createFileRoute("/_authenticated/admin/homepage")({
  component: HomepagePage,
});

function HomepagePage() {
  const fn = useServerFn(adminListAll);
  const save = useServerFn(saveSiteSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn() });

  const [root, setRoot] = useState<any>({});
  const [i18n, setI18n] = useState<any>({ ar: blank(), en: blank() });

  useEffect(() => {
    if (!data) return;
    const s: any = data.settings;
    if (s) {
      setRoot({
        hero_image: s.hero_image ?? "",
        hero_slides: Array.isArray(s.hero_slides) ? s.hero_slides : [],
        show_all_sections: s.show_all_sections ?? true,
        show_focus_areas: s.show_focus_areas ?? true,
        show_projects: s.show_projects ?? true,
        show_news: s.show_news ?? true,
        show_documents: s.show_documents ?? true,
        show_partners: s.show_partners ?? true,
        show_stats: s.show_stats ?? true,
      });
    }
    const ar = (data.settingsI18n as any[]).find((x) => x.lang === "ar");
    const en = (data.settingsI18n as any[]).find((x) => x.lang === "en");
    setI18n({ ar: { ...blank(), ...(ar ?? {}) }, en: { ...blank(), ...(en ?? {}) } });
  }, [data]);

  const mut = useMutation({
    mutationFn: async () => {
      // merge with existing settings to avoid clobbering
      const s: any = data?.settings ?? {};
      const arRow: any = (data?.settingsI18n as any[])?.find((x) => x.lang === "ar") ?? {};
      const enRow: any = (data?.settingsI18n as any[])?.find((x) => x.lang === "en") ?? {};
      return save({ data: {
        logo_url: s.logo_url ?? null,
        favicon_url: s.favicon_url ?? null,
        primary_color: s.primary_color,
        accent_color: s.accent_color,
        default_language: s.default_language,
        contact_email: s.contact_email ?? null,
        contact_phone: s.contact_phone ?? null,
        seo_og_image: s.seo_og_image ?? null,
        map_embed_url: s.map_embed_url ?? null,
        sponsorship_url: s.sponsorship_url ?? null,
        head_scripts: s.head_scripts ?? null,
        visitor_counter_enabled: s.visitor_counter_enabled ?? true,
        visitor_count_start: Number(s.visitor_count_start ?? 0) || 0,
        social_links: s.social_links ?? {},
        hero_image: root.hero_image || null,
        hero_slides: Array.isArray(root.hero_slides) ? root.hero_slides.filter((u: string) => !!u) : [],
        show_all_sections: root.show_all_sections ?? true,
        show_focus_areas: root.show_focus_areas ?? true,
        show_projects: root.show_projects ?? true,
        show_news: root.show_news ?? true,
        show_documents: root.show_documents ?? true,
        show_partners: root.show_partners ?? true,
        show_stats: root.show_stats ?? true,
        i18n: [
          mergeHomepageI18n("ar", arRow, i18n.ar),
          mergeHomepageI18n("en", enRow, i18n.en),
        ],
      } });
    },
    onSuccess: () => {
      toast.success("Homepage saved");
      qc.invalidateQueries({ queryKey: ["admin-all"] });
      qc.invalidateQueries({ queryKey: ["site-data"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminShell title="Homepage">
      <div className="max-w-3xl space-y-6">
        <Section title="Hero (البطل)">
          <p className="text-xs text-muted-foreground">
            The hero image is used as the full-width background. Title, description and short quote appear overlaid on top.
          </p>
          <ImageUpload
            label="Hero background image"
            value={root.hero_image}
            onChange={(v) => setRoot({ ...root, hero_image: v })}
            folder="hero"
            help="Landscape works best (e.g. 1920×1080). It will be darkened for text legibility."
          />
          <Tabs defaultValue="ar">
            <TabsList>
              <TabsTrigger value="ar">العربية</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            {(["ar", "en"] as const).map((l) => (
              <TabsContent key={l} value={l} className="space-y-3 pt-3">
                <Field
                  label={l === "ar" ? "شارة قصيرة (Tagline)" : "Tagline (short badge)"}
                  value={i18n[l].hero_tagline}
                  onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], hero_tagline: v } })}
                />
                <Field
                  label={l === "ar" ? "عنوان البطل" : "Hero title"}
                  value={i18n[l].hero_title}
                  onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], hero_title: v } })}
                />
                <Field
                  label={l === "ar" ? "وصف البطل" : "Hero description"}
                  textarea
                  value={i18n[l].hero_description}
                  onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], hero_description: v } })}
                />
                <Field
                  label={l === "ar" ? "اقتباس قصير (اختياري)" : "Short quote (optional)"}
                  textarea
                  value={i18n[l].hero_quote}
                  onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], hero_quote: v } })}
                />
              </TabsContent>
            ))}
          </Tabs>
        </Section>

        <Section title="Homepage sections (إظهار / إخفاء الأقسام)">
          <p className="text-xs text-muted-foreground">
            Master toggle hides every section (only the hero remains). Or hide individual sections below.
          </p>
          <ToggleRow
            label="Show all sections (الإظهار العام)"
            checked={root.show_all_sections ?? true}
            onChange={(v) => setRoot({ ...root, show_all_sections: v })}
          />
          <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-border/60">
            <ToggleRow label="Statistics (الإحصائيات)" checked={root.show_stats ?? true} onChange={(v) => setRoot({ ...root, show_stats: v })} />
            <ToggleRow label="Focus Areas (مجالات العمل)" checked={root.show_focus_areas ?? true} onChange={(v) => setRoot({ ...root, show_focus_areas: v })} />
            <ToggleRow label="Projects (المشاريع)" checked={root.show_projects ?? true} onChange={(v) => setRoot({ ...root, show_projects: v })} />
            <ToggleRow label="News (الأخبار)" checked={root.show_news ?? true} onChange={(v) => setRoot({ ...root, show_news: v })} />
            <ToggleRow label="Partners (الشركاء)" checked={root.show_partners ?? true} onChange={(v) => setRoot({ ...root, show_partners: v })} />
            <ToggleRow label="Documents (الوثائق)" checked={root.show_documents ?? true} onChange={(v) => setRoot({ ...root, show_documents: v })} />
          </div>
        </Section>

        <Button onClick={() => mut.mutate()} disabled={mut.isPending} size="lg">
          {mut.isPending ? "Saving..." : "Save homepage"}
        </Button>
      </div>
    </AdminShell>
  );
}

function Section({ title, children }: any) {
  return (
    <section className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  );
}
function Field({ label, value, onChange, textarea }: { label: string; value: any; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {textarea
        ? <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        : <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
      <Label className="text-sm font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
function blank() {
  return { hero_tagline: "", hero_title: "", hero_description: "", hero_quote: "" };
}
