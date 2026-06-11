import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getSiteData, submitContactMessage } from "@/lib/content.functions";
import { Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Lam7et Khair" }] }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1).max(2000),
});

function Body() {
  const { lang, t } = useI18n();
  const fn = useServerFn(getSiteData);
  const submitFn = useServerFn(submitContactMessage);
  const { data } = useQuery({ queryKey: ["site-data"], queryFn: () => fn(), staleTime: 60_000 });
  const i = pickI18n(data?.settingsI18n, lang) as any;
  const s = data?.settings as any;
  const address = i?.address ?? "";
  const mapUrl: string | null = s?.map_embed_url ?? null;

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const mut = useMutation({
    mutationFn: async () => {
      const parsed = schema.parse(form);
      return submitFn({ data: parsed });
    },
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم إرسال رسالتك" : "Your message has been sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    },
    onError: (e: any) => toast.error(e?.issues?.[0]?.message ?? e?.message ?? "Error"),
  });

  return (
    <div className="container-narrow py-16 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">{t("nav.contact")}</h1>
      <p className="text-muted-foreground mb-10">{i?.tagline}</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {s?.contact_email && <Card icon={Mail} label="Email" value={s.contact_email} href={`mailto:${s.contact_email}`} />}
        {s?.contact_phone && <Card icon={Phone} label="Phone" value={s.contact_phone} href={`tel:${s.contact_phone}`} />}
        {address && <Card icon={MapPin} label="Address" value={address} />}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
          className="rounded-xl border border-border/60 bg-card p-6 space-y-4"
        >
          <h2 className="text-xl font-semibold">{lang === "ar" ? "أرسل لنا رسالة" : "Send us a message"}</h2>
          <div className="space-y-1.5">
            <Label>{lang === "ar" ? "الاسم" : "Name"}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} required />
          </div>
          <div className="space-y-1.5">
            <Label>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={255} required />
          </div>
          <div className="space-y-1.5">
            <Label>{lang === "ar" ? "الموضوع" : "Subject"}</Label>
            <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label>{lang === "ar" ? "الرسالة" : "Message"}</Label>
            <Textarea rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} maxLength={2000} required />
          </div>
          <Button type="submit" disabled={mut.isPending} className="w-full">
            {mut.isPending ? (lang === "ar" ? "جارٍ الإرسال..." : "Sending...") : (lang === "ar" ? "إرسال" : "Send")}
          </Button>
        </form>

        <div className="rounded-xl border border-border/60 overflow-hidden min-h-[360px] bg-muted">
          {mapUrl ? (
            <iframe
              src={mapUrl}
              title="Map"
              className="w-full h-full min-h-[360px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center p-6 text-sm text-muted-foreground text-center">
              {lang === "ar"
                ? "أضف رابط خريطة جوجل في الإعدادات لعرضها هنا."
                : "Add a Google Maps embed URL in Settings to display the map."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value, href }: any) {
  const inner = (
    <div className="rounded-xl border border-border/60 bg-card p-5 hover:border-primary/60 transition h-full">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium break-words">{value}</div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
