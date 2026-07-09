import { describe, it, expect } from "vitest";
import { mergeAboutI18n, mergeHomepageI18n, type SettingsI18nRow } from "./settings-merge";

const existing = (lang: "ar" | "en"): Partial<SettingsI18nRow> => ({
  lang,
  site_name: `site-${lang}`,
  admin_sidebar_name: `admin-${lang}`,
  about_title: `about-title-${lang}`,
  tagline: `tagline-${lang}`,
  about_short: `about-short-${lang}`,
  about_body: `about-body-${lang}`,
  footer_text: `footer-${lang}`,
  seo_title: `seo-t-${lang}`,
  seo_description: `seo-d-${lang}`,
  address: `addr-${lang}`,
  sponsorship_text: `sponsor-${lang}`,
  hero_tagline: `hero-tag-${lang}`,
  hero_title: `hero-title-${lang}`,
  hero_description: `hero-desc-${lang}`,
  hero_quote: `hero-quote-${lang}`,
});

describe("mergeAboutI18n — regression: About save must not wipe hero_* / sponsorship_text", () => {
  for (const lang of ["ar", "en"] as const) {
    it(`preserves hero_* and sponsorship_text when saving About [${lang}]`, () => {
      const before = existing(lang);
      const merged = mergeAboutI18n(lang, before, {
        about_title: "new about title",
        tagline: "new tagline",
        about_short: "new short",
        about_body: "new body",
      });
      expect(merged.hero_tagline).toBe(before.hero_tagline);
      expect(merged.hero_title).toBe(before.hero_title);
      expect(merged.hero_description).toBe(before.hero_description);
      expect(merged.hero_quote).toBe(before.hero_quote);
      expect(merged.sponsorship_text).toBe(before.sponsorship_text);
      // About fields ARE updated
      expect(merged.about_title).toBe("new about title");
      expect(merged.tagline).toBe("new tagline");
      expect(merged.about_short).toBe("new short");
      expect(merged.about_body).toBe("new body");
      // Other unrelated fields still preserved
      expect(merged.footer_text).toBe(before.footer_text);
      expect(merged.seo_title).toBe(before.seo_title);
      expect(merged.address).toBe(before.address);
    });

    it(`keeps hero_* as empty strings (never undefined/null) when existing row has none [${lang}]`, () => {
      const merged = mergeAboutI18n(lang, {}, { about_title: "x", tagline: "y", about_short: "z", about_body: "w" });
      expect(merged.hero_tagline).toBe("");
      expect(merged.hero_title).toBe("");
      expect(merged.hero_description).toBe("");
      expect(merged.hero_quote).toBe("");
      expect(merged.sponsorship_text).toBe("");
    });

    it(`handles null existing row without throwing [${lang}]`, () => {
      const merged = mergeAboutI18n(lang, null, { about_title: "x" });
      expect(merged.lang).toBe(lang);
      expect(merged.hero_title).toBe("");
    });
  }
});

describe("mergeHomepageI18n — symmetric guarantee for the Homepage save path", () => {
  for (const lang of ["ar", "en"] as const) {
    it(`preserves about_* / sponsorship_text when saving Homepage [${lang}]`, () => {
      const before = existing(lang);
      const merged = mergeHomepageI18n(lang, before, {
        hero_tagline: "new tag",
        hero_title: "new title",
        hero_description: "new desc",
        hero_quote: "new quote",
      });
      expect(merged.about_title).toBe(before.about_title);
      expect(merged.tagline).toBe(before.tagline);
      expect(merged.about_short).toBe(before.about_short);
      expect(merged.about_body).toBe(before.about_body);
      expect(merged.sponsorship_text).toBe(before.sponsorship_text);
      expect(merged.hero_title).toBe("new title");
    });
  }
});
