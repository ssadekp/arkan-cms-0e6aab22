import { useI18n } from "@/lib/i18n";
import { Mail, Phone, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SocialIcon, type SocialPlatform } from "./SocialIcon";

interface Props {
  siteName: string;
  footerText: string;
  contact: { email?: string | null; phone?: string | null; address?: string | null };
}

const ARKAN_URL = "https://arkan-foundation.org";

export function Footer({ siteName, footerText, contact }: Props) {
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
          <span>
            {lang === "ar" ? "تحت رعاية " : "Under the patronage of "}
            <a
              href={ARKAN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary underline-offset-4 hover:underline transition"
            >
              {lang === "ar" ? "مؤسسة أركان" : "Arkan Foundation"}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
