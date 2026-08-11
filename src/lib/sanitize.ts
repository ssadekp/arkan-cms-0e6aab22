import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return "";
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    // `style` stays allowed (DOMPurify sanitizes its CSS) so editor colours,
    // highlights and text alignment survive on the public site.
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "onchange", "onsubmit"],
  });
}

/** Plain-text version of rich HTML — used in card summaries and listings. */
export function stripHtml(input: string | null | undefined): string {
  if (!input) return "";
  return sanitizeHtml(input)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
