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
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { toast } from "sonner";
import { mergeAboutI18n } from "@/lib/settings-merge";

export const Route = createFileRoute("/_authenticated/admin/about")({
  component: AboutAdmin,
});

function AboutAdmin() {
  const fn = useServerFn(adminListAll);
  const save = useServerFn(saveSiteSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn() });

  const [i18n, setI18n] = useState<any>(null);
  const [aboutImage, setAboutImage] = useState<string>("");

  useEffect(() => {
    if (!data?.settings) return;
    const all = data.settingsI18n as any[];
    const pick = (l: string) => {
      const r = all.find((x) => x.lang === l) ?? {};
      return { about_title: r.about_title ?? "", tagline: r.tagline ?? "", about_short: r.about_short ?? "", about_body: r.about_body ?? "" };
    };
    setI18n({ ar: pick("ar"), en: pick("en") });
    setAboutImage(((data.settings as any).about_image as string) ?? "");
  }, [data]);

  const mut = useMutation({
    mutationFn: async () => {
      const s: any = data!.settings;
      const all = data!.settingsI18n as any[];
      const merge = (l: "ar" | "en") =>
        mergeAboutI18n(l, all.find((x) => x.lang === l), i18n[l]);
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
        about_image: aboutImage || null,
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
                <div className="space-y-1.5"><Label>About page title</Label><Input value={i18n[l].about_title} onChange={(e) => setI18n({ ...i18n, [l]: { ...i18n[l], about_title: e.target.value } })} /></div>
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

        <Section title="About page image">
          <ImageUpload
            label="Image"
            value={aboutImage}
            onChange={setAboutImage}
            folder="about"
            help="Shown at the top of the public About Us page. This is separate from the homepage banner and the homepage About section."
          />
        </Section>

        <Section title="Mission, Vision & Values">
          <ResourceManager
            table="about_values"
            title="Mission / Vision / Values"
            rootFields={[
              { key: "icon", label: "Icon name (lucide) — e.g. target, eye, heart" },
              { key: "image", label: "Image or icon file (optional)", type: "image" },
              { key: "sort_order", label: "Sort order", type: "number" },
              { key: "published", label: "Published", type: "boolean" },
            ]}
            i18nFields={[
              { key: "title", label: "Title" },
              { key: "description", label: "Description", type: "textarea" },
            ]}
            listLabel={(row, i18n) =>
              i18n.find((x: any) => x.value_id === row.id && x.lang === "ar")?.title ||
              i18n.find((x: any) => x.value_id === row.id && x.lang === "en")?.title ||
              "Untitled"
            }
          />
        </Section>

        <Section title="Team members">
          <ResourceManager
            table="team_members"
            title="Team Members"
            rootFields={[
              { key: "photo", label: "Photo", type: "image" },
              { key: "sort_order", label: "Sort order", type: "number" },
              { key: "published", label: "Published", type: "boolean" },
            ]}
            i18nFields={[
              { key: "name", label: "Name" },
              { key: "position", label: "Position / job title" },
              { key: "description", label: "Description / role", type: "textarea" },
            ]}
            listLabel={(row, i18n) =>
              i18n.find((x: any) => x.member_id === row.id && x.lang === "ar")?.name ||
              i18n.find((x: any) => x.member_id === row.id && x.lang === "en")?.name ||
              "Unnamed"
            }
          />
        </Section>

        <Section title="Homepage statistics">
          <ResourceManager
            table="homepage_stats"
            title="Homepage Stats"
            rootFields={[
              { key: "icon", label: "Icon name (lucide)" },
              { key: "value", label: "Value (e.g. 1,200+)" },
              { key: "sort_order", label: "Sort order", type: "number" },
              { key: "active", label: "Active", type: "boolean" },
            ]}
            i18nFields={[{ key: "label", label: "Label" }]}
            listLabel={(row, i18n) => `${row.value} — ${i18n.find((x: any) => x.stat_id === row.id && x.lang === "ar")?.label ?? ""}`}
          />
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
