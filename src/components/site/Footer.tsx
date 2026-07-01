import { useI18n } from "@/lib/i18n";
import { Mail, Phone, MapPin, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SocialIcon, type SocialPlatform } from "./SocialIcon";

interface Props {
  siteName: string;
  footerText: string;
  contact: { email?: string | null; phone?: string | null; address?: string | null };
  sponsorshipText?: string;
  sponsorshipUrl?: string;
  visitorCounterEnabled?: boolean;
}

const SESSION_KEYS = { counted: "vc-counted", total: "vc-total" } as const;

function useVisitorCount(enabled: boolean) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const cached = window.sessionStorage.getItem(SESSION_KEYS.total);
    if (window.sessionStorage.getItem(SESSION_KEYS.counted) === "1" && cached) {
      setCount(Number(cached) || 0);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("increment_visitor_count");
      if (cancelled) return;
      if (!error && data != null) {
        const n = Number(data);
        setCount(n);
        window.sessionStorage.setItem(SESSION_KEYS.counted, "1");
        window.sessionStorage.setItem(SESSION_KEYS.total, String(n));
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  return count;
}

export function Footer({ siteName, footerText, contact, sponsorshipText, sponsorshipUrl, visitorCounterEnabled = true }: Props) {
  const { t, lang, dir } = useI18n();

  const { data: socialLinks } = useQuery({
    queryKey: ["site-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("id, platform_name, platform_icon, url")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const visitorCount = useVisitorCount(!!visitorCounterEnabled);
  const formattedCount =
    visitorCount == null ? null : new Intl.NumberFormat(lang === "ar" ? "ar-EG" : "en-US").format(visitorCount);

  return (
    <footer className="mt-24 border-t border-border/60 bg-sidebar text-sidebar-foreground">
      <div className="container-narrow py-12 grid gap-10 md:grid-cols-3">
        <div>
          <h3 className="text-lg font-semibold">{siteName}</h3>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">{footerText}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">{t("nav.contact")}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {contact.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {contact.email}</li>}
            {contact.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {contact.phone}</li>}
            {contact.address && <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {contact.address}</li>}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">{lang === "ar" ? "تابعنا" : "Follow us"}</h4>
          <div className="flex flex-wrap gap-3">
            {(socialLinks ?? []).map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.platform_name}
                title={s.platform_name}
                className="grid h-9 w-9 place-items-center rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition"
              >
                <SocialIcon platform={s.platform_icon as SocialPlatform} className="h-4 w-4" />
              </a>
            ))}
          </div>

          {visitorCounterEnabled && (
            <div className="mt-6" dir={dir}>
              <div className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-background/60 backdrop-blur px-4 py-2 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
                </span>
                <Eye className="h-4 w-4 text-primary" />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {lang === "ar" ? "عدد الزوار" : "Visitors"}
                  </span>
                  <span className="text-sm font-semibold tabular-nums" aria-live="polite">
                    {formattedCount ?? (lang === "ar" ? "..." : "...")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-border/40 py-4">
        <div
          className="container-narrow flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground"
          dir={dir}
        >
          <span>
            © {new Date().getFullYear()} {siteName}
            {" — "}
            {lang === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </span>
          {sponsorshipText ? (
            sponsorshipUrl ? (
              <a
                href={sponsorshipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground/90 hover:text-primary underline-offset-4 hover:underline transition"
              >
                {sponsorshipText}
              </a>
            ) : (
              <span className="font-medium text-foreground/90">{sponsorshipText}</span>
            )
          ) : (
            <span />
          )}
        </div>
      </div>
    </footer>
  );
}
