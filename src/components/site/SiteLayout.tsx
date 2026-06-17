import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
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


  return (
    <div className="min-h-screen flex flex-col">
      <Header
        siteName={siteName}
        logoUrl={settings?.logo_url}
        navPages={data?.navPages ?? []}
        navPagesI18n={data?.navPagesI18n ?? []}
      />
      <main className="flex-1">{children}</main>
      <Footer
        siteName={siteName}
        footerText={footerText}
        contact={{ email: settings?.contact_email, phone: settings?.contact_phone, address }}
        sponsorshipText={(settingsI18n as any)?.sponsorship_text ?? ""}
        sponsorshipUrl={(settings as any)?.sponsorship_url ?? ""}
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
