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
import { RichEditor } from "@/components/admin/RichEditor";
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
  const [i18n, setI18n] = useState<any>({ ar: blank(), en: blank() });

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
        seo_og_image: s.seo_og_image ?? "",
        map_embed_url: (s as any).map_embed_url ?? "",
      });
      setSocial(JSON.stringify(s.social_links ?? {}, null, 2));

    }

    const ar = (data.settingsI18n as any[]).find((x) => x.lang === "ar");
    const en = (data.settingsI18n as any[]).find((x) => x.lang === "en");
    setI18n({ ar: { ...blank(), ...(ar ?? {}) }, en: { ...blank(), ...(en ?? {}) } });
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
        seo_og_image: root.seo_og_image || null,
        map_embed_url: root.map_embed_url || null,
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

        <Section title="Social links (JSON)">
          <Textarea rows={6} value={social} onChange={(e) => setSocial(e.target.value)}
            placeholder='{"facebook":"https://...","instagram":"https://..."}' />
        </Section>

        <Section title="SEO">
          <Field label="OG image URL" value={root.seo_og_image} onChange={(v) => setRoot({ ...root, seo_og_image: v })} />
        </Section>

        <Section title="Site identity (AR / EN)">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Site name</span> appears on the public website (footer, header brand).{" "}
            <span className="font-medium">Admin sidebar name</span> appears only in this admin panel's sidebar.
          </p>
          <Tabs defaultValue="ar">
            <TabsList>
              <TabsTrigger value="ar">العربية</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            {(["ar", "en"] as const).map((l) => (
              <TabsContent key={l} value={l} className="space-y-3 pt-3">
                <Field label={l === "ar" ? "اسم الموقع (Site name)" : "Site name"} value={i18n[l].site_name} onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], site_name: v } })} />
                <Field label={l === "ar" ? "اسم لوحة التحكم (Admin sidebar name)" : "Admin sidebar name"} value={i18n[l].admin_sidebar_name} onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], admin_sidebar_name: v } })} />
              </TabsContent>
            ))}
          </Tabs>
        </Section>

        <Section title="Footer & SEO content (AR / EN)">
          <p className="text-xs text-muted-foreground">
            Contact details are managed under <span className="font-medium">Contact Us</span>. About content and statistics are managed under <span className="font-medium">About Us</span>.
          </p>
          <Tabs defaultValue="ar">
            <TabsList>
              <TabsTrigger value="ar">العربية</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            {(["ar", "en"] as const).map((l) => (
              <TabsContent key={l} value={l} className="space-y-3 pt-3">
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
function RichField({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <RichEditor value={value ?? ""} onChange={onChange} />
    </div>
  );
}
function blank() {
  return { site_name: "", admin_sidebar_name: "", about_title: "", tagline: "", about_short: "", about_body: "", footer_text: "", seo_title: "", seo_description: "", address: "" };
}
function stripI18n(r: any) {
  return {
    site_name: r.site_name ?? "",
    admin_sidebar_name: r.admin_sidebar_name ?? "",
    about_title: r.about_title ?? "",
    tagline: r.tagline ?? "",
    about_short: r.about_short ?? "",
    about_body: r.about_body ?? "",
    footer_text: r.footer_text ?? "",
    seo_title: r.seo_title ?? "",
    seo_description: r.seo_description ?? "",
    address: r.address ?? "",
  };
}
