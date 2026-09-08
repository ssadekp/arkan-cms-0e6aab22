import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { ThemeInjector } from "./ThemeInjector";
import { I18nProvider, pickI18n, useI18n } from "@/lib/i18n";
import { getSiteData } from "@/lib/content.functions";

export const siteQueryKey = ["site-data"] as const;

function applyFavicon(url: string | null | undefined) {
  if (typeof document === "undefined") return;
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

function Inner({ children }: { children: ReactNode }) {
  const fn = useServerFn(getSiteData);
  const { data } = useQuery({ queryKey: siteQueryKey, queryFn: () => fn(), staleTime: 60_000 });
  const { lang, setLang } = useI18n();
  const href = useRouterState({ select: (st) => st.location.href });

  const settings = data?.settings;
  const settingsI18n = pickI18n(data?.settingsI18n, lang);
  const siteName = settingsI18n?.site_name ?? "Lam7et Khair";
  const footerText = settingsI18n?.footer_text ?? "";
  const address = (settingsI18n as any)?.address ?? "";
  const singleLanguage = ((settings as any)?.language_mode ?? "dual") === "single";
  const defaultLang = ((settings as any)?.default_language ?? "ar") as "ar" | "en";
  const hiddenModules = ((settings as any)?.hidden_modules ?? []) as string[];

  useEffect(() => {
    if (singleLanguage && lang !== defaultLang) setLang(defaultLang);
  }, [singleLanguage, defaultLang, lang]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const title = (settingsI18n as any)?.site_title;
    if (!title) return;
    document.title = title;
    // route-level head() tags can land after this effect; re-apply next tick
    const id = window.setTimeout(() => { document.title = title; }, 0);
    return () => window.clearTimeout(id);
  }, [settingsI18n, href]);

  useEffect(() => {
    applyFavicon((settings as any)?.favicon_url);
  }, [settings]);


  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = (settings as any)?.head_scripts as string | null | undefined;
    if (!html) return;
    const container = document.createElement("div");
    container.setAttribute("data-injected-head", "site-head-scripts");
    container.innerHTML = html;
    const nodes: Node[] = [];
    Array.from(container.childNodes).forEach((node) => {
      if (node.nodeType === 1 && (node as Element).tagName === "SCRIPT") {
        const src = node as HTMLScriptElement;
        const fresh = document.createElement("script");
        Array.from(src.attributes).forEach((a) => fresh.setAttribute(a.name, a.value));
        fresh.text = src.text;
        document.head.appendChild(fresh);
        nodes.push(fresh);
      } else {
        document.head.appendChild(node);
        nodes.push(node);
      }
    });
    return () => { nodes.forEach((n) => n.parentNode?.removeChild(n)); };
  }, [(settings as any)?.head_scripts]);


  return (
    <div className="min-h-screen flex flex-col">
      <ThemeInjector />
      <Header
        siteName={siteName}
        logoUrl={settings?.logo_url}
        navPages={data?.navPages ?? []}
        navPagesI18n={data?.navPagesI18n ?? []}
        menuItems={(data as any)?.menuItems ?? []}
        hiddenModules={hiddenModules}
        showLanguageSwitch={!singleLanguage}
        showDonate={((settings as any)?.donation_enabled ?? true) !== false}
      />

      <main className="flex-1">{children}</main>
      <Footer
        siteName={siteName}
        logoUrl={settings?.logo_url}

        footerText={footerText}
        contact={{ email: settings?.contact_email, phone: settings?.contact_phone, address }}
        sponsorshipText={(settingsI18n as any)?.sponsorship_text ?? ""}
        sponsorshipUrl={(settings as any)?.sponsorship_url ?? ""}
        visitorCounterEnabled={(settings as any)?.visitor_counter_enabled ?? true}
      />

    </div>
  );
}


export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <Inner>{children}</Inner>
    </I18nProvider>
  );
}
