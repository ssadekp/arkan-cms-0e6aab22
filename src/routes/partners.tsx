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
  const { t } = useI18n();
  const fn = useServerFn(getPartners);
  const { data } = useQuery({ queryKey: ["partners-all"], queryFn: () => fn(), staleTime: 60_000 });
  return (
    <div className="container-narrow py-16">
      <h1 className="text-3xl font-bold mb-8">{t("nav.partners")}</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(data ?? []).map((p) => (
          <a key={p.id} href={p.website_url ?? "#"} target="_blank" rel="noreferrer"
             className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border/60 bg-card hover:border-primary/60 transition">
            {p.logo_url ? <img src={p.logo_url} alt={p.name} className="h-16 w-16 object-contain" /> : <div className="h-16 w-16 rounded bg-muted" />}
            <span className="text-sm font-medium text-center">{p.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
