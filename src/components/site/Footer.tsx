import { useI18n } from "@/lib/i18n";
import { Mail, Phone, MapPin, Eye, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SocialIcon, type SocialPlatform } from "./SocialIcon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  siteName: string;
  logoUrl?: string | null;
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

export function Footer({ siteName, logoUrl, footerText, contact, sponsorshipText, sponsorshipUrl, visitorCounterEnabled = true }: Props) {
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
    <footer className="mt-24 bg-[#050505] text-white/85">
      <div className="container-narrow py-16 grid gap-12 md:grid-cols-4">
        {/* Brand + newsletter */}
        <div className="md:col-span-2">
          <h3 className="text-xl font-semibold text-white">{siteName}</h3>
          <p className="mt-3 text-sm text-white/60 max-w-md leading-relaxed">{footerText}</p>

          <form
            className="mt-6 flex gap-2 max-w-md"
            onSubmit={(e) => e.preventDefault()}
          >
            <Input
              type="email"
              required
              placeholder={lang === "ar" ? "بريدك الإلكتروني" : "Your email"}
              className="bg-white/5 border-white/15 text-white placeholder:text-white/40 focus-visible:ring-primary rounded-full h-11 px-5"
            />
            <Button
              type="submit"
              className="rounded-full h-11 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">{lang === "ar" ? "اشترك" : "Subscribe"}</span>
            </Button>
          </form>

          {visitorCounterEnabled && (
            <div className="mt-6" dir={dir}>
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
                </span>
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] uppercase tracking-wider text-white/50">
                  {lang === "ar" ? "الزوار" : "Visitors"}
                </span>
                <span className="text-sm font-semibold tabular-nums text-white" aria-live="polite">
                  {formattedCount ?? "…"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-semibold mb-4 text-white uppercase tracking-wider">{t("nav.contact")}</h4>
          <ul className="space-y-3 text-sm text-white/60">
            {contact.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> {contact.email}</li>}
            {contact.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> {contact.phone}</li>}
            {contact.address && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {contact.address}</li>}
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="text-sm font-semibold mb-4 text-white uppercase tracking-wider">{lang === "ar" ? "تابعنا" : "Follow us"}</h4>
          <div className="flex flex-wrap gap-2">
            {(socialLinks ?? []).map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.platform_name}
                title={s.platform_name}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-primary hover:text-primary-foreground hover:border-primary transition"
              >
                <SocialIcon platform={s.platform_icon as SocialPlatform} className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-5">
        <div
          className="container-narrow flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50"
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
                className="font-medium text-white/80 hover:text-primary underline-offset-4 hover:underline transition"
              >
                {sponsorshipText}
              </a>
            ) : (
              <span className="font-medium text-white/80">{sponsorshipText}</span>
            )
          ) : (
            <span />
          )}
        </div>
      </div>
    </footer>
  );
}
