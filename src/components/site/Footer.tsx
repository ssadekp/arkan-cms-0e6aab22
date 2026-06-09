import { useI18n } from "@/lib/i18n";
import { Facebook, Instagram, Twitter, Youtube, Linkedin, Mail, Phone, MapPin } from "lucide-react";

interface Props {
  siteName: string;
  footerText: string;
  social: Record<string, string>;
  contact: { email?: string | null; phone?: string | null; address?: string | null };
}

const icons: Record<string, any> = {
  facebook: Facebook, instagram: Instagram, twitter: Twitter, x: Twitter, youtube: Youtube, linkedin: Linkedin,
};

export function Footer({ siteName, footerText, social, contact }: Props) {
  const { t } = useI18n();
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
          <h4 className="text-sm font-semibold mb-3">Social</h4>
          <div className="flex gap-3">
            {Object.entries(social ?? {}).map(([k, url]) => {
              const Icon = icons[k.toLowerCase()] ?? Mail;
              return (
                <a key={k} href={url} target="_blank" rel="noreferrer"
                   className="grid h-9 w-9 place-items-center rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition">
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteName}
      </div>
    </footer>
  );
}
