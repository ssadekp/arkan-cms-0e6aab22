import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getHomeData, getSiteData } from "@/lib/content.functions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Pause, Play, Quote, Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import heroEducation from "@/assets/hero-education.jpg";
import focusBg from "@/assets/hero-community.jpg";



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

  const heroSlides = useMemo(() => {
    const primary = (s.hero_image as string | null) || "";
    const extra: string[] = Array.isArray(s.hero_slides) ? s.hero_slides.filter((u: any) => typeof u === "string" && u.trim()) : [];
    const all = [primary, ...extra].filter(Boolean);
    return all.length > 0 ? all : [heroEducation];
  }, [s.hero_image, s.hero_slides]);

  const [slideIdx, setSlideIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  useEffect(() => {
    if (heroSlides.length <= 1 || isPaused) return;
    const id = window.setInterval(() => {
      setSlideIdx((i) => (i + 1) % heroSlides.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [heroSlides.length, isPaused]);
  useEffect(() => { setSlideIdx(0); }, [heroSlides.length]);

  const goPrev = () => setSlideIdx((i) => (i - 1 + heroSlides.length) % heroSlides.length);
  const goNext = () => setSlideIdx((i) => (i + 1) % heroSlides.length);
  // Visual prev/next depending on language (in RTL, "previous" sits on the right)
  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <>
      {/* HERO — full-bleed background image(s) with overlaid centered text */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {heroSlides.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-in-out ${i === slideIdx ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/55 to-black/40" />
          {heroSlides.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
              <button
                type="button"
                aria-label="Previous slide"
                onClick={goPrev}
                className="grid place-items-center h-8 w-8 rounded-full bg-white/15 backdrop-blur border border-white/25 text-white hover:bg-white/30 transition"
              >
                <PrevIcon className="h-4 w-4" />
              </button>
              <div className="flex gap-2">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setSlideIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === slideIdx ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
                onClick={() => setIsPaused((p) => !p)}
                className="grid place-items-center h-8 w-8 rounded-full bg-white/15 backdrop-blur border border-white/25 text-white hover:bg-white/30 transition"
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={goNext}
                className="grid place-items-center h-8 w-8 rounded-full bg-white/15 backdrop-blur border border-white/25 text-white hover:bg-white/30 transition"
              >
                <NextIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Corner quote — top-right for AR, top-left for EN */}
        {settingsI18n?.hero_quote?.trim() && (
          <div
            className={`hidden md:flex absolute top-6 ${dir === "rtl" ? "right-6" : "left-6"} z-10 max-w-xs items-start gap-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-4 text-white`}
          >
            <Quote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-snug text-white/95">
              {settingsI18n.hero_quote}
            </p>
          </div>
        )}

        <div className="container-narrow relative py-24 md:py-36 lg:py-44 text-white">
          <div className="max-w-3xl mx-auto text-center">
            {(settingsI18n as any)?.hero_tagline?.trim() && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur text-white px-3 py-1 text-xs font-semibold tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {(settingsI18n as any).hero_tagline}
              </span>
            )}
            {(settingsI18n as any)?.hero_title?.trim() && (
              <h1 className="mt-5 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight drop-shadow">
                {(settingsI18n as any).hero_title}
              </h1>
            )}
            {(settingsI18n as any)?.hero_description?.trim() && (
              <p className="mt-6 text-lg text-white/90 max-w-xl mx-auto leading-relaxed">
                {(settingsI18n as any).hero_description}
              </p>
            )}

            {/* Mobile fallback for the quote (corner card is hidden on small screens) */}
            {settingsI18n?.hero_quote?.trim() && (
              <div className="md:hidden mt-6 mx-auto flex items-start gap-3 rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-4 max-w-lg text-left rtl:text-right">
                <Quote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-snug text-white/95">
                  {settingsI18n.hero_quote}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link to="/projects">
                <Button size="lg" className="gap-2 rounded-full px-6">
                  {t("home.heroCta")} <Arrow className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="rounded-full px-6 bg-white/10 text-white border-white/40 hover:bg-white/20 hover:text-white">
                  {t("nav.about")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>




      {/* ABOUT — styled like a project card */}
      {(settingsI18n?.about_title || settingsI18n?.about_short) && (
        <section className="container-narrow py-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl font-semibold">{t("nav.about")}</h2>
            <Link to="/about" className="text-sm text-primary hover:underline">{t("common.moreDetails")}</Link>
          </div>
          <Link to="/about" className="group block rounded-xl overflow-hidden border border-border/60 bg-card hover:border-primary/60 transition shadow-soft">
            <div className="aspect-video bg-muted overflow-hidden">
              <img
                src={heroSlides[0]}
                alt=""
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-5 md:p-6">
              {settingsI18n?.about_title && (
                <h3 className="font-semibold text-lg md:text-xl">{settingsI18n.about_title}</h3>
              )}
              {settingsI18n?.about_short && (
                <div
                  className="mt-2 text-sm text-muted-foreground line-clamp-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: settingsI18n.about_short }}
                />
              )}
            </div>
          </Link>
        </section>
      )}


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

      {/* FOCUS AREAS — dark band with bg image + 4 icon columns */}
      {show("show_focus_areas") && (
        <section className="relative overflow-hidden py-20 text-white">
          <div className="absolute inset-0 -z-10">
            <img src={focusBg} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f14]/95 via-[#0a1f14]/88 to-[#0a1f14]/95" />
          </div>
          <div className="container-narrow">
            <div className="text-center mb-14 max-w-2xl mx-auto">
              <span className="inline-block h-1 w-12 bg-primary rounded-full mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{t("home.focus")}</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {(home?.focus ?? []).slice(0, 4).map((f) => {
                const i18n = pickI18n(home!.focusI18n.filter((x) => x.focus_area_id === f.id), lang);
                return (
                  <Link
                    key={f.id}
                    to="/focus-areas/$slug"
                    params={{ slug: f.slug }}
                    className="group flex flex-col items-center text-center px-2"
                  >
                    <div className="relative mb-5">
                      <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl group-hover:bg-primary/40 transition" />
                      <div className="relative grid place-items-center h-20 w-20 rounded-full border border-white/20 bg-white/5 backdrop-blur group-hover:border-primary/60 group-hover:bg-primary/10 transition">
                        {(f as any).icon ? (
                          <img src={(f as any).icon} alt="" className="h-10 w-10 object-contain" />
                        ) : (
                          <Target className="h-9 w-9 text-primary" />
                        )}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg text-white group-hover:text-primary transition">{i18n?.title}</h3>
                    <p className="mt-2 text-sm text-white/70 line-clamp-3 leading-relaxed">{i18n?.description}</p>
                  </Link>
                );
              })}
            </div>
            <div className="mt-12 text-center">
              <Link to="/focus-areas" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-white transition">
                {t("common.viewAll")} <Arrow className="h-4 w-4" />
              </Link>
            </div>
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
