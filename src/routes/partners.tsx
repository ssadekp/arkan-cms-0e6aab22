import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { getPartners } from "@/lib/content.functions";

export const Route = createFileRoute("/partners")({
  head: () => ({ meta: [{ title: "Partners — Lam7et Khair" }] }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { t, lang } = useI18n();
  const fn = useServerFn(getPartners);
  const { data } = useQuery({ queryKey: ["partners-all"], queryFn: () => fn(), staleTime: 60_000 });
  const partners = data?.partners ?? [];
  const partnersI18n = data?.partnersI18n ?? [];
  const nameOf = (p: any) =>
    partnersI18n.find((x: any) => x.partner_id === p.id && x.lang === lang)?.name
    || partnersI18n.find((x: any) => x.partner_id === p.id && x.lang === "ar")?.name
    || p.name;
  return (
    <div className="container-narrow py-16">
      <h1 className="text-3xl font-bold mb-8">{t("nav.partners")}</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((p: any) => (
          <a key={p.id} href={p.website_url ?? "#"} target="_blank" rel="noreferrer"
             className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/60 bg-card hover:border-primary/60 transition">
            {p.logo_url ? <img src={p.logo_url} alt={nameOf(p)} className="h-28 w-full object-contain" /> : <div className="h-28 w-full rounded bg-muted" />}
            <span className="text-sm font-medium text-center">{nameOf(p)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
