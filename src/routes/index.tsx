import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getHomeData, getSiteData } from "@/lib/content.functions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Quote, Target } from "lucide-react";
import heroEducation from "@/assets/hero-education.jpg";
import heroHealth from "@/assets/hero-health.jpg";
import heroCommunity from "@/assets/hero-community.jpg";
import heroRehab from "@/assets/hero-rehab.jpg";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lam7et Khair Foundation — مؤسسة لمحة خير" },
      { name: "description", content: "Community development, healthcare, education, and rehabilitation projects across Egypt." },
      { property: "og:title", content: "Lam7et Khair Foundation" },
      { property: "og:description", content: "Community development, healthcare, education, and rehabilitation." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteLayout>
      <HomeBody />
    </SiteLayout>
  );
}

function HomeBody() {
  const { lang, t, dir } = useI18n();
  const homeFn = useServerFn(getHomeData);
  const siteFn = useServerFn(getSiteData);
  const { data: home } = useQuery({ queryKey: ["home-data"], queryFn: () => homeFn(), staleTime: 60_000 });
  const { data: site } = useQuery({ queryKey: ["site-data"], queryFn: () => siteFn(), staleTime: 60_000 });

  const settingsI18n = pickI18n(site?.settingsI18n, lang);
  const s: any = site?.settings ?? {};
  const showAll = s.show_all_sections !== false;
  const show = (key: string) => showAll && s[key] !== false;
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <>
      {/* HERO — mosaic collage over faint world map */}
      <section className="relative overflow-hidden hero-gradient">
        {/* faint world map backdrop */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1200 500"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06] text-foreground"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
              <circle cx="1.2" cy="1.2" r="1.2" fill="currentColor" />
            </pattern>
            <mask id="worldmask">
              {/* stylized continent silhouettes */}
              <rect width="1200" height="500" fill="black" />
              <path fill="white" d="M120,180 q40,-60 120,-60 q90,-10 140,40 q60,50 40,120 q-20,60 -100,80 q-90,20 -160,-20 q-70,-40 -60,-100 z" />
              <path fill="white" d="M420,120 q60,-40 150,-30 q120,10 180,70 q60,60 40,150 q-20,90 -140,120 q-140,30 -240,-30 q-90,-60 -80,-160 q10,-80 90,-120 z" />
              <path fill="white" d="M760,80 q80,-30 190,-10 q140,30 180,120 q30,90 -60,160 q-120,80 -260,60 q-140,-20 -170,-130 q-20,-100 120,-200 z" />
              <path fill="white" d="M540,340 q40,-10 90,10 q60,30 40,90 q-30,70 -110,60 q-70,-10 -70,-80 q0,-60 50,-80 z" />
            </mask>
          </defs>
          <rect width="1200" height="500" fill="url(#dots)" mask="url(#worldmask)" />
        </svg>

        <div className="container-narrow relative py-20 md:py-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12 items-center">
            {/* HEADLINE — right in RTL, left in LTR (order via CSS) */}
            <div className={`lg:col-span-6 ${dir === "rtl" ? "lg:order-2 text-right" : "lg:order-1 text-left"}`}>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {settingsI18n?.tagline}
              </span>
              <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
                {settingsI18n?.site_name}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
                {settingsI18n?.about_short}
              </p>
              <div className={`mt-8 flex flex-wrap gap-3 ${dir === "rtl" ? "justify-end" : "justify-start"}`}>
                <Link to="/projects">
                  <Button size="lg" className="gap-2 rounded-full px-6">
                    {t("home.heroCta")} <Arrow className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button size="lg" variant="outline" className="rounded-full px-6 btn-ink border-transparent">
                    {t("nav.about")}
                  </Button>
                </Link>
              </div>
            </div>

            {/* MOSAIC — left in RTL, right in LTR */}
            <div className={`lg:col-span-6 ${dir === "rtl" ? "lg:order-1" : "lg:order-2"}`}>
              <div className="relative mx-auto aspect-square max-w-[520px]">
                <div className="grid grid-cols-6 grid-rows-6 gap-3 h-full w-full">
                  <div className="col-span-4 row-span-3 rounded-2xl overflow-hidden shadow-card">
                    <img src={heroEducation} alt="" className="h-full w-full object-cover" width={1024} height={1024} />
                  </div>
                  <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden shadow-card">
                    <img src={heroRehab} alt="" loading="lazy" className="h-full w-full object-cover" width={1024} height={1024} />
                  </div>
                  <div className="col-span-2 row-span-4 rounded-2xl overflow-hidden shadow-card bg-[var(--ink)] text-[var(--ink-foreground)] flex flex-col justify-end p-5">
                    <div className="text-4xl md:text-5xl font-extrabold leading-none text-primary">15<span className="text-white">+</span></div>
                    <div className="mt-2 text-xs uppercase tracking-wider opacity-80">{lang === "ar" ? "عام من العطاء" : "Years of impact"}</div>
                  </div>
                  <div className="col-span-2 row-span-3 rounded-2xl overflow-hidden shadow-card">
                    <img src={heroCommunity} alt="" loading="lazy" className="h-full w-full object-cover" width={1024} height={1024} />
                  </div>
                  <div className="col-span-2 row-span-3 rounded-2xl overflow-hidden shadow-card">
                    <img src={heroHealth} alt="" loading="lazy" className="h-full w-full object-cover" width={1024} height={1024} />
                  </div>
                </div>

                {/* Floating quote card */}
                <div className={`absolute ${dir === "rtl" ? "-right-4 md:-right-10" : "-left-4 md:-left-10"} -bottom-6 max-w-[240px] rounded-2xl bg-card border border-border/60 shadow-card p-4`}>
                  <Quote className="h-5 w-5 text-primary" />
                  <p className="mt-2 text-sm font-medium leading-snug">
                    {lang === "ar"
                      ? "لمحة خير تُغيّر حياة، وتزرع الأمل في كل بيت."
                      : "A glimpse of goodness changes lives and plants hope in every home."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* STATS */}
      {show("show_stats") && (home?.stats?.length ?? 0) > 0 && (
        <section className="container-narrow py-16">
          <h2 className="text-2xl font-semibold text-center mb-10">{t("home.stats")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {home!.stats.map((s) => {
              const label = pickI18n(home!.statsI18n.filter((x) => x.stat_id === s.id), lang)?.label;
              return (
                <div key={s.id} className="rounded-xl border border-border/60 bg-card p-6 text-center shadow-soft">
                  <div className="text-3xl md:text-4xl font-bold text-primary">{s.value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{label}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FOCUS AREAS */}
      {show("show_focus_areas") && (
      <section className="container-narrow py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl font-semibold">{t("home.focus")}</h2>
          <Link to="/focus-areas" className="text-sm text-primary hover:underline">{t("common.viewAll")}</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(home?.focus ?? []).map((f) => {
            const i18n = pickI18n(home!.focusI18n.filter((x) => x.focus_area_id === f.id), lang);
            return (
              <Link
                key={f.id}
                to="/focus-areas/$slug"
                params={{ slug: f.slug }}
                className="group rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition shadow-soft"
              >
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {f.hero_image ? (
                    <img src={f.hero_image} alt={i18n?.title ?? ""} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-primary/40"><Target className="h-10 w-10" /></div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{i18n?.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{i18n?.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      )}

      {/* PROJECTS */}
      {show("show_projects") && (
      <section className="bg-surface/40 border-y border-border/60 py-16">
        <div className="container-narrow">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-semibold">{t("home.projects")}</h2>
            <Link to="/projects" className="text-sm text-primary hover:underline">{t("common.viewAll")}</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(home?.projects ?? []).map((p) => {
              const i18n = pickI18n(home!.projectsI18n.filter((x) => x.project_id === p.id), lang);
              return (
                <Link key={p.id} to="/projects/$slug" params={{ slug: p.slug }}
                  className="group rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition shadow-soft">
                  <div className="aspect-video bg-muted overflow-hidden">
                    {p.hero_image && <img src={p.hero_image} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold">{i18n?.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{i18n?.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* NEWS */}
      {show("show_news") && (home?.news?.length ?? 0) > 0 && (
        <section className="container-narrow py-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-semibold">{t("home.news")}</h2>
            <Link to="/news" className="text-sm text-primary hover:underline">{t("common.viewAll")}</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {home!.news.map((n) => {
              const i18n = pickI18n(home!.newsI18n.filter((x) => x.news_id === n.id), lang);
              return (
                <Link key={n.id} to="/news/$slug" params={{ slug: n.slug }}
                  className="group rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition shadow-soft">
                  <div className="aspect-video bg-muted overflow-hidden">
                    {n.hero_image && <img src={n.hero_image} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-muted-foreground">{new Date(n.published_at).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US")}</div>
                    <h3 className="mt-1 font-semibold">{i18n?.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{i18n?.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* PARTNERS */}
      {show("show_partners") && (home?.partners?.length ?? 0) > 0 && (
        <section className="container-narrow py-16">
          <h2 className="text-2xl font-semibold text-center mb-8">{t("home.partners")}</h2>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {home!.partners.map((p) => {
              const name = (home as any).partnersI18n?.find((x: any) => x.partner_id === p.id && x.lang === lang)?.name
                || (home as any).partnersI18n?.find((x: any) => x.partner_id === p.id && x.lang === "ar")?.name
                || p.name;
              return (
                <a key={p.id} href={p.website_url ?? "#"} target="_blank" rel="noreferrer"
                   className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border/60 bg-card hover:border-primary/60 transition">
                  {p.logo_url && <img src={p.logo_url} alt={name} className="h-8 w-8 object-contain" />}
                  <span className="text-sm font-medium">{name}</span>
                </a>
              );
            })}

          </div>
        </section>
      )}
    </>
  );
}
