import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getThemeTokens } from "@/lib/branding.functions";

export const themeQueryKey = ["theme-tokens"] as const;

function toCssFamily(name: string) {
  // Ensure spaces are quoted, e.g. "IBM Plex Sans"
  const n = (name || "").trim();
  if (!n) return "";
  return /\s/.test(n) ? `"${n}"` : n;
}

function googleFontHref(families: string[]) {
  const unique = Array.from(new Set(families.map((f) => (f || "").trim()).filter(Boolean)));
  if (unique.length === 0) return "";
  const parts = unique.map((f) => {
    const family = f.replace(/\s+/g, "+");
    return `family=${family}:wght@400;500;600;700;800`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

export function ThemeInjector() {
  const fn = useServerFn(getThemeTokens);
  const { data } = useQuery({ queryKey: themeQueryKey, queryFn: () => fn(), staleTime: 5 * 60_000 });

  useEffect(() => {
    if (!data || typeof document === "undefined") return;
    const root = document.documentElement;
    const map: Record<string, string> = {
      "--primary": data.primary_hex,
      "--brand": data.primary_hex,
      "--ring": data.primary_hex,
      "--sidebar-primary": data.primary_hex,
      "--sidebar-ring": data.primary_hex,
      "--ink": data.ink_hex,
      "--secondary": data.ink_hex,
      "--background": data.background_hex,
      "--foreground": data.foreground_hex,
      "--sidebar-foreground": data.foreground_hex,
      "--surface": data.surface_hex,
      "--muted": data.surface_hex,
      "--sidebar": data.background_hex,
      "--sidebar-accent": data.surface_hex,
      "--accent": data.accent_hex,
      "--destructive": data.destructive_hex,
      "--border": data.border_hex,
      "--input": data.border_hex,
      "--sidebar-border": data.border_hex,
      "--radius": `${data.radius_rem}rem`,
    };
    const prev: Record<string, string> = {};
    Object.entries(map).forEach(([k, v]) => {
      prev[k] = root.style.getPropertyValue(k);
      root.style.setProperty(k, v);
    });

    // Fonts: override CSS variables
    const display = toCssFamily(data.font_display);
    const body = toCssFamily(data.font_body);
    const arabic = toCssFamily(data.font_arabic);
    const fontMap: Record<string, string> = {
      "--font-sans": `${body}, system-ui, sans-serif`,
      "--font-display": `${display}, system-ui, sans-serif`,
      "--font-arabic": `${arabic}, system-ui, sans-serif`,
    };
    Object.entries(fontMap).forEach(([k, v]) => {
      prev[k] = root.style.getPropertyValue(k);
      root.style.setProperty(k, v);
    });

    // Inject Google Fonts <link>
    const href = googleFontHref([data.font_display, data.font_body, data.font_arabic]);
    let link: HTMLLinkElement | null = null;
    if (href) {
      link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-theme-fonts", "1");
      document.head.appendChild(link);
    }

    return () => {
      Object.entries(prev).forEach(([k, v]) => {
        if (v) root.style.setProperty(k, v);
        else root.style.removeProperty(k);
      });
      if (link && link.parentNode) link.parentNode.removeChild(link);
    };
  }, [data]);

  return null;
}
