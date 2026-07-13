import { useEffect, useState } from "react";

// Module-level cache: url -> "mask" | "img"
const modeCache = new Map<string, "mask" | "img">();
const inflight = new Map<string, Promise<"mask" | "img">>();

function detectMode(url: string): Promise<"mask" | "img"> {
  const cached = modeCache.get(url);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(url);
  if (existing) return existing;

  const lower = url.split("?")[0].toLowerCase();
  // Non-SVG (png/jpg/webp/gif) cannot be masked reliably to preserve original colors either way — render as <img>.
  if (!lower.endsWith(".svg")) {
    modeCache.set(url, "img");
    return Promise.resolve("img");
  }

  const p = fetch(url)
    .then((r) => r.text())
    .then((text) => {
      // Consider the SVG "colored" if it declares any non-neutral fill/stroke color
      // (i.e. anything other than none / currentColor / inherit). Also treat presence of
      // <style>, gradients, images or multiple distinct colors as colored.
      const colorAttr = /(fill|stroke)\s*=\s*"(?!\s*(none|currentColor|inherit|transparent)\s*")([^"]+)"/i;
      const styleColor = /(fill|stroke)\s*:\s*(?!\s*(none|currentColor|inherit|transparent))[^;"'}]+/i;
      const hasStyleBlock = /<style[\s>]/i.test(text);
      const hasGradient = /<(linearGradient|radialGradient|image)\b/i.test(text);
      const colored =
        colorAttr.test(text) ||
        styleColor.test(text) ||
        hasStyleBlock ||
        hasGradient;
      const mode: "mask" | "img" = colored ? "img" : "mask";
      modeCache.set(url, mode);
      return mode;
    })
    .catch(() => {
      // On fetch failure, fall back to <img> so the icon still renders.
      modeCache.set(url, "img");
      return "img" as const;
    })
    .finally(() => {
      inflight.delete(url);
    });
  inflight.set(url, p);
  return p;
}

export function FocusIcon({ src, alt = "" }: { src: string; alt?: string }) {
  const [mode, setMode] = useState<"mask" | "img" | null>(() => modeCache.get(src) ?? null);

  useEffect(() => {
    let cancelled = false;
    if (modeCache.has(src)) {
      setMode(modeCache.get(src)!);
      return;
    }
    setMode(null);
    detectMode(src).then((m) => {
      if (!cancelled) setMode(m);
    });
    return () => {
      cancelled = true;
    };
  }, [src]);

  if (mode === "img") {
    return (
      <img
        src={src}
        alt={alt}
        aria-hidden={alt ? undefined : true}
        className="block h-10 w-10 object-contain"
        loading="lazy"
        decoding="async"
      />
    );
  }

  // Default (mask) — also used while detection is in-flight for monochrome SVGs.
  return (
    <span
      aria-hidden
      className="block h-10 w-10 bg-primary group-hover:bg-white transition-colors"
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
