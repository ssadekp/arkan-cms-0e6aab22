/**
 * Build a clean, URL-friendly slug from a title.
 * Latin text is lowercased and hyphenated; Arabic text keeps its letters
 * (browsers/search engines handle UTF-8 slugs fine) with punctuation stripped.
 */
export function slugify(input: string): string {
  return (input || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    // strip latin diacritics and arabic tashkeel
    .replace(/[\u0300-\u036f\u064b-\u0652\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    // keep letters (latin + arabic), digits, spaces and dashes
    .replace(/[^a-z0-9\u0621-\u064a\s-]/g, " ")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Pick the best source title for a slug, preferring English then Arabic. */
export function slugFromTitles(en?: string | null, ar?: string | null): string {
  return slugify(en || "") || slugify(ar || "");
}
