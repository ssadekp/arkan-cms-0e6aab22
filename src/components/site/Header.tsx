import { Link } from "@tanstack/react-router";
import { useI18n, pickI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Globe, Sprout, Menu, X } from "lucide-react";
import { useState } from "react";

interface NavPage { id: string; slug: string; }
interface NavPageI18n { page_id: string; lang: string; title: string; }

interface Props {
  siteName: string;
  logoUrl?: string | null;
  navPages: NavPage[];
  navPagesI18n: NavPageI18n[];
}

export function Header({ siteName, logoUrl, navPages, navPagesI18n }: Props) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/about", label: t("nav.about") },
    { to: "/focus-areas", label: t("nav.focus") },
    { to: "/projects", label: t("nav.projects") },
    { to: "/partners", label: t("nav.partners") },
    { to: "/news", label: t("nav.news") },
    { to: "/contact", label: t("nav.contact") },
  ];

  const customLinks = navPages.map((p) => {
    const i18n = pickI18n(navPagesI18n.filter((x) => x.page_id === p.id), lang);
    return { to: `/p/${p.slug}`, label: i18n?.title ?? p.slug };
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-narrow flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-9 w-9 rounded-md object-cover" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </span>
          )}
          <span className="hidden sm:block text-base">{siteName}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {[...links, ...customLinks].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition"
              activeProps={{ className: "text-primary font-medium" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="gap-1.5"
          >
            <Globe className="h-4 w-4" />
            {t("lang.toggle")}
          </Button>


          <button
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <div className="container-narrow py-3 flex flex-col gap-1">
            {[...links, ...customLinks].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm hover:bg-muted/40"
              >
                {l.label}
              </Link>
            ))}
            <Link to="/auth" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm hover:bg-muted/40">
              {t("nav.signin")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
