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

export const Route = createFileRoute("/_authenticated/admin/contact")({
  component: ContactAdmin,
});

function ContactAdmin() {
  const fn = useServerFn(adminListAll);
  const save = useServerFn(saveSiteSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn() });

  const [state, setState] = useState<any>(null);

  useEffect(() => {
    if (!data?.settings) return;
    const s: any = data.settings;
    const ar = (data.settingsI18n as any[]).find((x) => x.lang === "ar") ?? {};
    const en = (data.settingsI18n as any[]).find((x) => x.lang === "en") ?? {};
    setState({
      contact_email: s.contact_email ?? "",
      contact_phone: s.contact_phone ?? "",
      map_embed_url: s.map_embed_url ?? "",
      ar_address: ar.address ?? "",
      en_address: en.address ?? "",
    });
  }, [data]);

  const mut = useMutation({
    mutationFn: async () => {
      const s: any = data!.settings;
      const ar = (data!.settingsI18n as any[]).find((x) => x.lang === "ar") ?? {};
      const en = (data!.settingsI18n as any[]).find((x) => x.lang === "en") ?? {};
      return save({ data: {
        logo_url: s.logo_url ?? null,
        primary_color: s.primary_color,
        accent_color: s.accent_color,
        default_language: s.default_language,
        seo_og_image: s.seo_og_image ?? null,
        social_links: s.social_links ?? {},
        contact_email: state.contact_email || null,
        contact_phone: state.contact_phone || null,
        map_embed_url: state.map_embed_url || null,
        i18n: [
          { lang: "ar", site_name: ar.site_name ?? "", tagline: ar.tagline ?? "", about_short: ar.about_short ?? "", about_body: ar.about_body ?? "", footer_text: ar.footer_text ?? "", seo_title: ar.seo_title ?? "", seo_description: ar.seo_description ?? "", address: state.ar_address ?? "" },
          { lang: "en", site_name: en.site_name ?? "", tagline: en.tagline ?? "", about_short: en.about_short ?? "", about_body: en.about_body ?? "", footer_text: en.footer_text ?? "", seo_title: en.seo_title ?? "", seo_description: en.seo_description ?? "", address: state.en_address ?? "" },
        ],
      } });
    },
    onSuccess: () => {
      toast.success("Contact details saved");
      qc.invalidateQueries({ queryKey: ["admin-all"] });
      qc.invalidateQueries({ queryKey: ["site-data"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!state) return <AdminShell title="Contact Us"><div className="p-6 text-sm text-muted-foreground">Loading…</div></AdminShell>;

  return (
    <AdminShell title="Contact Us">
      <div className="max-w-3xl space-y-6">
        <Section title="Contact details">
          <div className="space-y-1.5"><Label>Email</Label><Input value={state.contact_email} onChange={(e) => setState({ ...state, contact_email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={state.contact_phone} onChange={(e) => setState({ ...state, contact_phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Google Maps embed URL</Label><Input value={state.map_embed_url} onChange={(e) => setState({ ...state, map_embed_url: e.target.value })} placeholder="https://www.google.com/maps/embed?pb=..." /></div>
        </Section>

        <Section title="Address (translatable)">
          <Tabs defaultValue="ar">
            <TabsList>
              <TabsTrigger value="ar">العربية</TabsTrigger>
              <TabsTrigger value="en">English</TabsTrigger>
            </TabsList>
            <TabsContent value="ar" className="pt-3">
              <Textarea rows={3} value={state.ar_address} onChange={(e) => setState({ ...state, ar_address: e.target.value })} />
            </TabsContent>
            <TabsContent value="en" className="pt-3">
              <Textarea rows={3} value={state.en_address} onChange={(e) => setState({ ...state, en_address: e.target.value })} />
            </TabsContent>
          </Tabs>
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
