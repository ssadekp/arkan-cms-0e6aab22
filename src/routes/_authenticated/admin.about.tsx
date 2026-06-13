import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAll, saveSiteSettings } from "@/lib/admin.functions";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichEditor } from "@/components/admin/RichEditor";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/about")({
  component: AboutAdmin,
});

function AboutAdmin() {
  const fn = useServerFn(adminListAll);
  const save = useServerFn(saveSiteSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn() });

  const [i18n, setI18n] = useState<any>(null);

  useEffect(() => {
    if (!data?.settings) return;
    const all = data.settingsI18n as any[];
    const pick = (l: string) => {
      const r = all.find((x) => x.lang === l) ?? {};
      return { site_name: r.site_name ?? "", tagline: r.tagline ?? "", about_short: r.about_short ?? "", about_body: r.about_body ?? "" };
    };
    setI18n({ ar: pick("ar"), en: pick("en") });
  }, [data]);

  const mut = useMutation({
    mutationFn: async () => {
      const s: any = data!.settings;
      const all = data!.settingsI18n as any[];
      const merge = (l: "ar" | "en") => {
        const existing = all.find((x) => x.lang === l) ?? {};
        return {
          lang: l,
          site_name: i18n[l].site_name,
          tagline: i18n[l].tagline,
          about_short: i18n[l].about_short,
          about_body: i18n[l].about_body,
          footer_text: existing.footer_text ?? "",
          seo_title: existing.seo_title ?? "",
          seo_description: existing.seo_description ?? "",
          address: existing.address ?? "",
        };
      };
      return save({ data: {
        logo_url: s.logo_url ?? null,
        primary_color: s.primary_color,
        accent_color: s.accent_color,
        default_language: s.default_language,
        seo_og_image: s.seo_og_image ?? null,
        social_links: s.social_links ?? {},
        contact_email: s.contact_email ?? null,
        contact_phone: s.contact_phone ?? null,
        map_embed_url: s.map_embed_url ?? null,
        i18n: [merge("ar"), merge("en")],
      } });
    },
    onSuccess: () => {
      toast.success("About page saved");
      qc.invalidateQueries({ queryKey: ["admin-all"] });
      qc.invalidateQueries({ queryKey: ["site-data"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!i18n) return <AdminShell title="About Us"><div className="p-6 text-sm text-muted-foreground">Loading…</div></AdminShell>;

  return (
    <AdminShell title="About Us">
      <div className="max-w-3xl space-y-6">
        <Section title="Content (AR / EN)">
          <Tabs defaultValue="ar">
            <TabsList>
              <TabsTrigger value="ar">العربية</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            {(["ar", "en"] as const).map((l) => (
              <TabsContent key={l} value={l} className="space-y-3 pt-3">
                <div className="space-y-1.5"><Label>Site name</Label><Input value={i18n[l].site_name} onChange={(e) => setI18n({ ...i18n, [l]: { ...i18n[l], site_name: e.target.value } })} /></div>
                <div className="space-y-1.5"><Label>Tagline</Label><Input value={i18n[l].tagline} onChange={(e) => setI18n({ ...i18n, [l]: { ...i18n[l], tagline: e.target.value } })} /></div>
                <div className="space-y-1.5">
                  <Label>About (short summary)</Label>
                  <RichEditor value={i18n[l].about_short} onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], about_short: v } })} />
                </div>
                <div className="space-y-1.5">
                  <Label>About body (full content)</Label>
                  <RichEditor value={i18n[l].about_body} onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], about_body: v } })} />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Section>

        <Section title="Homepage statistics">
          <p className="text-sm text-muted-foreground">Stats shown on the About and Home pages are managed in their own section.</p>
          <Link to="/admin/stats">
            <Button variant="outline" size="sm"><BarChart3 className="h-4 w-4 mr-2" />Manage Homepage Stats</Button>
          </Link>
        </Section>

        <Button onClick={() => mut.mutate()} disabled={mut.isPending} size="lg">
          {mut.isPending ? "Saving..." : "Save"}
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
