import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { I18nProvider, pickI18n, useI18n } from "@/lib/i18n";
import { getSiteData } from "@/lib/content.functions";

export const siteQueryKey = ["site-data"] as const;

function Inner({ children }: { children: ReactNode }) {
  const fn = useServerFn(getSiteData);
  const { data } = useQuery({ queryKey: siteQueryKey, queryFn: () => fn(), staleTime: 60_000 });
  const { lang } = useI18n();

  const settings = data?.settings;
  const settingsI18n = pickI18n(data?.settingsI18n, lang);
  const siteName = settingsI18n?.site_name ?? "Lam7et Khair";
  const footerText = settingsI18n?.footer_text ?? "";

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
        social={(settings?.social_links as Record<string, string>) ?? {}}
        contact={{ email: settings?.contact_email, phone: settings?.contact_phone, address: settings?.contact_address }}
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
