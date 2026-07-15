import { useQuery } from "@tanstack/react-query";
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
  const { lang } = useI18n();

  const settings = data?.settings;
  const settingsI18n = pickI18n(data?.settingsI18n, lang);
  const siteName = settingsI18n?.site_name ?? "Lam7et Khair";
  const footerText = settingsI18n?.footer_text ?? "";
  const address = (settingsI18n as any)?.address ?? "";

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
      />
      <main className="flex-1">{children}</main>
      <Footer
        siteName={siteName}
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
