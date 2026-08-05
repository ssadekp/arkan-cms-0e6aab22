import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getTeamMember } from "@/lib/content.functions";

export const Route = createFileRoute("/team/$id")({
  head: () => ({
    meta: [
      { title: "Team Member — Our Team" },
      { name: "description", content: "Profile of a team member: photo, role and full biography." },
      { property: "og:title", content: "Team Member — Our Team" },
      { property: "og:description", content: "Profile of a team member: photo, role and full biography." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { id } = Route.useParams();
  const { lang, t } = useI18n();
  const fn = useServerFn(getTeamMember);
  const { data, isLoading } = useQuery({ queryKey: ["team-member", id], queryFn: () => fn({ data: { id } }) });

  if (isLoading) return <div className="container-narrow py-16 text-muted-foreground">…</div>;
  if (!data) {
    return (
      <div className="container-narrow py-16">
        <p className="text-muted-foreground">{lang === "ar" ? "لم يتم العثور على عضو الفريق." : "Team member not found."}</p>
        <Link to="/about" className="mt-4 inline-block text-primary hover:underline">{t("about.team")}</Link>
      </div>
    );
  }

  const tr = pickI18n(data.i18n, lang) as any;
  const Arrow = lang === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="container-narrow py-12">
      <Link to="/about" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <Arrow className="h-4 w-4" />
        {t("about.team")}
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,360px)_1fr] items-start">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-muted aspect-square">
          {data.member.photo && (
            <img src={data.member.photo} alt={tr?.name || "Team member"} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{tr?.name}</h1>
          {tr?.description && (
            <p className="mt-5 text-base leading-relaxed text-muted-foreground whitespace-pre-line">{tr.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
