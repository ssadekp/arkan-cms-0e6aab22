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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const fn = useServerFn(adminListAll);
  const save = useServerFn(saveSiteSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn() });

  const [root, setRoot] = useState<any>({});
  const [social, setSocial] = useState("{}");
  const [i18n, setI18n] = useState<any>({ ar: {}, en: {} });

  useEffect(() => {
    if (!data) return;
    const s = data.settings;
    if (s) {
      setRoot({
        logo_url: s.logo_url ?? "",
        primary_color: s.primary_color,
        accent_color: s.accent_color,
        default_language: s.default_language,
        contact_email: s.contact_email ?? "",
        contact_phone: s.contact_phone ?? "",
        contact_address: s.contact_address ?? "",
        seo_og_image: s.seo_og_image ?? "",
      });
      setSocial(JSON.stringify(s.social_links ?? {}, null, 2));
    }
    const ar = data.settingsI18n.find((x) => x.lang === "ar");
    const en = data.settingsI18n.find((x) => x.lang === "en");
    setI18n({ ar: ar ?? blank(), en: en ?? blank() });
  }, [data]);

  const mut = useMutation({
    mutationFn: async () => {
      let sl: Record<string, string> = {};
      try { sl = JSON.parse(social || "{}"); } catch { throw new Error("Social links must be valid JSON"); }
      return save({ data: {
        ...root,
        logo_url: root.logo_url || null,
        contact_email: root.contact_email || null,
        contact_phone: root.contact_phone || null,
        contact_address: root.contact_address || null,
        seo_og_image: root.seo_og_image || null,
        social_links: sl,
        i18n: [
          { lang: "ar", ...stripI18n(i18n.ar) },
          { lang: "en", ...stripI18n(i18n.en) },
        ],
      } });
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["admin-all"] });
      qc.invalidateQueries({ queryKey: ["site-data"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AdminShell title="Settings">
      <div className="max-w-3xl space-y-6">
        <Section title="Branding">
          <Field label="Logo URL" value={root.logo_url} onChange={(v) => setRoot({ ...root, logo_url: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Primary color" value={root.primary_color} onChange={(v) => setRoot({ ...root, primary_color: v })} />
            <Field label="Accent color" value={root.accent_color} onChange={(v) => setRoot({ ...root, accent_color: v })} />
          </div>
          <div className="space-y-1.5">
            <Label>Default language</Label>
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={root.default_language ?? "ar"} onChange={(e) => setRoot({ ...root, default_language: e.target.value })}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
        </Section>

        <Section title="Contact">
          <Field label="Email" value={root.contact_email} onChange={(v) => setRoot({ ...root, contact_email: v })} />
          <Field label="Phone" value={root.contact_phone} onChange={(v) => setRoot({ ...root, contact_phone: v })} />
          <Field label="Address" value={root.contact_address} onChange={(v) => setRoot({ ...root, contact_address: v })} />
        </Section>

        <Section title="Social links (JSON)">
          <Textarea rows={6} value={social} onChange={(e) => setSocial(e.target.value)}
            placeholder='{"facebook":"https://...","instagram":"https://..."}' />
        </Section>

        <Section title="SEO">
          <Field label="OG image URL" value={root.seo_og_image} onChange={(v) => setRoot({ ...root, seo_og_image: v })} />
        </Section>

        <Section title="Content (AR / EN)">
          <Tabs defaultValue="ar">
            <TabsList>
              <TabsTrigger value="ar">العربية</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            {(["ar", "en"] as const).map((l) => (
              <TabsContent key={l} value={l} className="space-y-3 pt-3">
                <Field label="Site name" value={i18n[l].site_name} onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], site_name: v } })} />
                <Field label="Tagline" value={i18n[l].tagline} onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], tagline: v } })} />
                <Field label="About (short)" textarea value={i18n[l].about_short} onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], about_short: v } })} />
                <Field label="Footer text" textarea value={i18n[l].footer_text} onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], footer_text: v } })} />
                <Field label="SEO title" value={i18n[l].seo_title} onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], seo_title: v } })} />
                <Field label="SEO description" textarea value={i18n[l].seo_description} onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], seo_description: v } })} />
              </TabsContent>
            ))}
          </Tabs>
        </Section>

        <Button onClick={() => mut.mutate()} disabled={mut.isPending} size="lg">
          {mut.isPending ? "Saving..." : "Save settings"}
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
function Field({ label, value, onChange, textarea }: any) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {textarea
        ? <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
        : <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}
function blank() { return { site_name: "", tagline: "", about_short: "", footer_text: "", seo_title: "", seo_description: "" }; }
function stripI18n(r: any) {
  return {
    site_name: r.site_name ?? "", tagline: r.tagline ?? "", about_short: r.about_short ?? "",
    footer_text: r.footer_text ?? "", seo_title: r.seo_title ?? "", seo_description: r.seo_description ?? "",
  };
}
