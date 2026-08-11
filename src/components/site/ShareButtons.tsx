import { useState } from "react";
import { Facebook, Linkedin, Link2, Check, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Props {
  title: string;
  className?: string;
}

/** Social sharing row for articles, projects, news and albums. */
export function ShareButtons({ title, className }: Props) {
  const { lang } = useI18n();
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { key: "facebook", label: "Facebook", Icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { key: "x", label: "X", Icon: XIcon, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { key: "whatsapp", label: "WhatsApp", Icon: WhatsAppIcon, href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { key: "linkedin", label: "LinkedIn", Icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { key: "telegram", label: "Telegram", Icon: Send, href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <span className="text-sm font-medium text-muted-foreground me-1">
        {lang === "ar" ? "شارك:" : "Share:"}
      </span>
      {links.map(({ key, label, Icon, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          title={label}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:border-primary/60 hover:text-primary"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        aria-label={lang === "ar" ? "نسخ الرابط" : "Copy link"}
        title={lang === "ar" ? "نسخ الرابط" : "Copy link"}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card text-muted-foreground transition hover:border-primary/60 hover:text-primary"
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.86 9.86 0 004.74 1.21c5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm0 18.02c-1.5 0-2.98-.4-4.26-1.16l-.3-.18-3.14.82.84-3.07-.2-.32a8.15 8.15 0 01-1.25-4.31c0-4.52 3.68-8.2 8.2-8.2s8.2 3.68 8.2 8.2-3.68 8.22-8.09 8.22zm4.5-6.14c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.65.8-.8.96-.14.17-.29.19-.54.06-.25-.12-1.06-.39-2.02-1.24-.75-.67-1.25-1.5-1.4-1.75-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.83-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1s.9 2.43 1.03 2.6c.12.16 1.76 2.8 4.28 3.83.6.26 1.06.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.19.21-.58.21-1.08.15-1.19-.06-.11-.23-.18-.48-.3z" />
    </svg>
  );
}
