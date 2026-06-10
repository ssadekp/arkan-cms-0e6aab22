import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getSiteData } from "@/lib/content.functions";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Lam7et Khair" }] }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { lang, t } = useI18n();
  const fn = useServerFn(getSiteData);
  const { data } = useQuery({ queryKey: ["site-data"], queryFn: () => fn(), staleTime: 60_000 });
  const i = pickI18n(data?.settingsI18n, lang) as any;
  const s = data?.settings;
  const address = i?.address ?? "";
  return (
    <div className="container-narrow py-16 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">{t("nav.contact")}</h1>
      <p className="text-muted-foreground mb-10">{i?.tagline}</p>
      <div className="grid sm:grid-cols-3 gap-4">
        {s?.contact_email && <Card icon={Mail} label="Email" value={s.contact_email} href={`mailto:${s.contact_email}`} />}
        {s?.contact_phone && <Card icon={Phone} label="Phone" value={s.contact_phone} href={`tel:${s.contact_phone}`} />}
        {address && <Card icon={MapPin} label="Address" value={address} />}
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value, href }: any) {
  const inner = (
    <div className="rounded-xl border border-border/60 bg-card p-5 hover:border-primary/60 transition">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium break-words">{value}</div>
    </div>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}
