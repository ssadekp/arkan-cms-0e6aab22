import { Link } from "@tanstack/react-router";
import { useI18n, pickI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Globe, Sprout, Menu, X, ChevronDown, Heart } from "lucide-react";
import { useState } from "react";
import { isNavUrlHidden } from "@/lib/modules";


interface NavPage { id: string; slug: string; }
interface NavPageI18n { page_id: string; lang: string; title: string; }
interface MenuItem {
  id: string;
  parent_id: string | null;
  position: number;
  label_en: string;
  label_ar: string;
  url: string;
  target: string;
  published: boolean;
}

interface Props {
  siteName: string;
  logoUrl?: string | null;
  navPages: NavPage[];
  navPagesI18n: NavPageI18n[];
  menuItems?: MenuItem[];
  hiddenModules?: string[];
  showLanguageSwitch?: boolean;
  showDonate?: boolean;
}

interface RenderLink { label: string; url: string; target?: string; children?: RenderLink[] }

export function Header({ siteName, logoUrl, navPages, navPagesI18n, menuItems = [], hiddenModules = [], showLanguageSwitch = true, showDonate = true }: Props) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);

  const donateVisible = showDonate && !isNavUrlHidden(hiddenModules, "/donate");



  let links: RenderLink[];
  if (menuItems.length > 0) {
    const parents = menuItems.filter((m) => !m.parent_id).sort((a, b) => a.position - b.position);
    links = parents.map((p) => ({
      label: (lang === "ar" ? p.label_ar : p.label_en) || p.label_en || p.label_ar,
      url: p.url,
      target: p.target,
      children: menuItems
        .filter((c) => c.parent_id === p.id)
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
          label: (lang === "ar" ? c.label_ar : c.label_en) || c.label_en || c.label_ar,
          url: c.url,
          target: c.target,
        })),
    }));
  } else {
    const defaults: RenderLink[] = [
      { label: t("nav.home"), url: "/" },
      { label: t("nav.about"), url: "/about" },
      { label: t("nav.focus"), url: "/focus-areas" },
      { label: t("nav.projects"), url: "/projects" },
      { label: t("nav.partners"), url: "/partners" },
      { label: t("nav.news"), url: "/news" },
      { label: t("nav.articles"), url: "/articles" },
      { label: t("nav.albums"), url: "/albums" },
      { label: t("nav.videoAlbums"), url: "/video-albums" },
      { label: t("nav.resources"), url: "/resources" },
      { label: t("nav.contact"), url: "/contact" },
      { label: t("nav.faq"), url: "/faq" },
    ];
    const custom: RenderLink[] = navPages.map((p) => {
      const i18n = pickI18n(navPagesI18n.filter((x) => x.page_id === p.id), lang);
      return { label: i18n?.title ?? p.slug, url: `/p/${p.slug}` };
    });
    links = [...defaults, ...custom];
  }

  links = links
    .filter((l) => !isNavUrlHidden(hiddenModules, l.url))
    .map((l) => ({
      ...l,
      children: (l.children ?? []).filter((c) => !isNavUrlHidden(hiddenModules, c.url)),
    }));

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-narrow flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-11 w-auto max-w-[220px] object-contain" />
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Sprout className="h-5 w-5" />
            </span>
          )}
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => <DesktopItem key={l.url + l.label} link={l} />)}
        </nav>

        <div className="flex items-center gap-2">
          {donateVisible && (
            <Button asChild size="sm" className="rounded-full px-4 font-semibold shadow-sm">
              <Link to="/donate">
                <Heart className="h-4 w-4 me-1" />
                {t("nav.donate")}
              </Link>
            </Button>
          )}
          {showLanguageSwitch && (
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="gap-1.5">
              <Globe className="h-4 w-4" />
              {t("lang.toggle")}
            </Button>
          )}

          <button className="lg:hidden p-2 rounded-md hover:bg-muted" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background">
          <div className="container-narrow py-3 flex flex-col gap-1">
            {links.map((l) => (
              <div key={l.url + l.label}>
                <NavAnchor link={l} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-sm hover:bg-muted/40" />
                {l.children && l.children.length > 0 && (
                  <div className="ms-4 border-s border-border/60 ps-2 mt-1 flex flex-col gap-1">
                    {l.children.map((c) => (
                      <NavAnchor key={c.url + c.label} link={c} onClick={() => setOpen(false)} className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function DesktopItem({ link }: { link: RenderLink }) {
  const hasChildren = !!(link.children && link.children.length > 0);
  if (!hasChildren) {
    return <NavAnchor link={link} className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition" />;
  }
  return (
    <div className="relative group">
      <button className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition">
        {link.label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <div className="absolute start-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
        <div className="min-w-[12rem] rounded-md border border-border/60 bg-popover shadow-md py-1">
          {link.children!.map((c) => (
            <NavAnchor key={c.url + c.label} link={c} className="block px-3 py-2 text-sm hover:bg-muted/40" />
          ))}
        </div>
      </div>
    </div>
  );
}

function NavAnchor({ link, className, onClick }: { link: RenderLink; className?: string; onClick?: () => void }) {
  const isExternal = /^https?:\/\//i.test(link.url) || link.target === "_blank";
  if (isExternal) {
    return (
      <a href={link.url} target={link.target || "_blank"} rel="noopener noreferrer" className={className} onClick={onClick}>
        {link.label}
      </a>
    );
  }
  return (
    <Link to={link.url} className={className} activeProps={{ className: `${className ?? ""} text-primary font-medium` }} activeOptions={{ exact: link.url === "/" }} onClick={onClick}>
      {link.label}
    </Link>
  );
}
