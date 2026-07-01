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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { SOCIAL_PLATFORMS, SocialIcon, type SocialPlatform } from "@/components/site/SocialIcon";
import { Trash2, Plus, Loader2 } from "lucide-react";
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
  const [i18n, setI18n] = useState<any>({ ar: blank(), en: blank() });

  useEffect(() => {
    if (!data) return;
    const s = data.settings;
    if (s) {
      setRoot({
        logo_url: s.logo_url ?? "",
        favicon_url: (s as any).favicon_url ?? "",
        primary_color: s.primary_color,
        accent_color: s.accent_color,
        default_language: s.default_language,
        contact_email: s.contact_email ?? "",
        contact_phone: s.contact_phone ?? "",
        seo_og_image: s.seo_og_image ?? "",
        map_embed_url: (s as any).map_embed_url ?? "",
        sponsorship_url: (s as any).sponsorship_url ?? "",
        head_scripts: (s as any).head_scripts ?? "",
        show_all_sections: (s as any).show_all_sections ?? true,
        show_focus_areas: (s as any).show_focus_areas ?? true,
        show_projects: (s as any).show_projects ?? true,
        show_news: (s as any).show_news ?? true,
        show_documents: (s as any).show_documents ?? true,
        show_partners: (s as any).show_partners ?? true,
        show_stats: (s as any).show_stats ?? true,
        visitor_counter_enabled: (s as any).visitor_counter_enabled ?? true,
        visitor_count_start: (s as any).visitor_count_start ?? 0,
        social_links: s.social_links ?? {},

      });
    }

    const ar = (data.settingsI18n as any[]).find((x) => x.lang === "ar");
    const en = (data.settingsI18n as any[]).find((x) => x.lang === "en");
    setI18n({ ar: { ...blank(), ...(ar ?? {}) }, en: { ...blank(), ...(en ?? {}) } });
  }, [data]);

  const mut = useMutation({
    mutationFn: async () =>
      save({ data: {
        ...root,
        logo_url: root.logo_url || null,
        favicon_url: root.favicon_url || null,
        contact_email: root.contact_email || null,
        contact_phone: root.contact_phone || null,
        seo_og_image: root.seo_og_image || null,
        map_embed_url: root.map_embed_url || null,
        sponsorship_url: root.sponsorship_url || null,
        head_scripts: root.head_scripts || null,
        show_all_sections: root.show_all_sections ?? true,
        show_focus_areas: root.show_focus_areas ?? true,
        show_projects: root.show_projects ?? true,
        show_news: root.show_news ?? true,
        show_documents: root.show_documents ?? true,
        show_partners: root.show_partners ?? true,
        show_stats: root.show_stats ?? true,
        visitor_counter_enabled: root.visitor_counter_enabled ?? true,
        visitor_count_start: Number(root.visitor_count_start ?? 0) || 0,
        social_links: root.social_links ?? {},

        i18n: [
          { lang: "ar", ...stripI18n(i18n.ar) },
          { lang: "en", ...stripI18n(i18n.en) },
        ],
      } }),

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
          <ImageUpload
            label="Logo"
            value={root.logo_url}
            onChange={(v) => setRoot({ ...root, logo_url: v })}
            folder="branding"
            help="Shown in the site header and footer."
          />
          <ImageUpload
            label="Favicon"
            value={root.favicon_url}
            onChange={(v) => setRoot({ ...root, favicon_url: v })}
            folder="branding"
            accept="image/png,image/x-icon,image/svg+xml,image/jpeg,image/webp"
            help="Browser tab icon. Square PNG, ICO, or SVG works best."
          />
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

        <Section title="Sponsorship line (Footer)">
          <p className="text-xs text-muted-foreground">
            Shown in the footer next to the copyright (e.g. "Under the patronage of …"). Leave the text empty to hide the line.
          </p>
          <Field
            label="Sponsorship URL"
            value={root.sponsorship_url}
            onChange={(v) => setRoot({ ...root, sponsorship_url: v })}
          />
          <Tabs defaultValue="ar">
            <TabsList>
              <TabsTrigger value="ar">العربية</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            {(["ar", "en"] as const).map((l) => (
              <TabsContent key={l} value={l} className="space-y-3 pt-3">
                <Field
                  label={l === "ar" ? "نص رعاية الموقع" : "Sponsorship text"}
                  value={i18n[l].sponsorship_text}
                  onChange={(v) => setI18n({ ...i18n, [l]: { ...i18n[l], sponsorship_text: v } })}
                />
              </TabsContent>
            ))}
          </Tabs>
        </Section>

        <Section title="Homepage sections (إظهار / إخفاء أقسام الصفحة الرئيسية)">
          <p className="text-xs text-muted-foreground">
            Turn off the master toggle to hide every homepage section (only the hero remains). Or hide individual sections below.
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

        <Section title="SEO">
          <ImageUpload
            label="Social share image (Open Graph)"
            value={root.seo_og_image}
            onChange={(v) => setRoot({ ...root, seo_og_image: v })}
            folder="seo"
            help="Appears when the site is shared on social media. 1200×630 recommended."
          />
        </Section>

        <Section title="Header scripts (Google Tag Manager, analytics, etc.)">
          <p className="text-xs text-muted-foreground">
            Paste raw HTML/script tags here (e.g. the GTM <code>&lt;script&gt;</code> snippet). It will be injected into the <code>&lt;head&gt;</code> of every public page. Leave empty to disable. Only paste code from sources you trust.
          </p>
          <div className="space-y-1.5">
            <Label>Head scripts</Label>
            <Textarea
              rows={8}
              className="font-mono text-xs"
              value={root.head_scripts ?? ""}
              onChange={(e) => setRoot({ ...root, head_scripts: e.target.value })}
              placeholder={"<!-- Google Tag Manager -->\n<script>...</script>"}
            />
          </div>
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

        <Section title="Social media links">
          <p className="text-xs text-muted-foreground">
            Manage the icons shown in the site footer. Changes here are saved instantly.
          </p>
          <SocialLinksManager />
        </Section>
      </div>
    </AdminShell>
  );
}

function SocialLinksManager() {
  const qc = useQueryClient();
  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return toast.error("URL is required");
    try { new URL(url.trim()); } catch { return toast.error("Please enter a valid URL"); }
    setBusy(true);
    try {
      const def = SOCIAL_PLATFORMS.find((p) => p.value === platform)!;
      const { error } = await supabase.from("social_links").insert({
        platform_name: def.label,
        platform_icon: def.value,
        url: url.trim(),
      });
      if (error) throw error;
      toast.success("Link added");
      setUrl("");
      setPlatform("facebook");
      qc.invalidateQueries({ queryKey: ["admin-social-links"] });
      qc.invalidateQueries({ queryKey: ["site-social-links"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this link?")) return;
    const { error } = await supabase.from("social_links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-social-links"] });
    qc.invalidateQueries({ queryKey: ["site-social-links"] });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onAdd} className="grid gap-3 md:grid-cols-[180px_1fr_auto] items-end">
        <div className="space-y-1.5">
          <Label>Platform</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOCIAL_PLATFORMS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <span className="inline-flex items-center gap-2">
                    <SocialIcon platform={p.value} className="h-4 w-4" />
                    {p.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-2">Loading…</p>
      ) : !data?.length ? (
        <p className="text-sm text-muted-foreground py-2">No social links yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-2 font-medium">
                    <SocialIcon platform={row.platform_icon as SocialPlatform} className="h-4 w-4" />
                    {row.platform_name}
                  </span>
                </TableCell>
                <TableCell className="text-sm">
                  <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                    {row.url}
                  </a>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(row.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
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
  return { site_name: "", admin_sidebar_name: "", about_title: "", tagline: "", about_short: "", about_body: "", footer_text: "", seo_title: "", seo_description: "", address: "", sponsorship_text: "" };
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
    sponsorship_text: r.sponsorship_text ?? "",
  };
}
