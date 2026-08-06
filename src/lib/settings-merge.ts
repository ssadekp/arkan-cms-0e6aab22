// Shared merge helpers for site_settings_i18n rows.
// Both the Homepage admin (edits hero_* fields) and the About admin
// (edits about_* + tagline fields) upsert the same i18n row, so each
// page must forward the fields it does NOT own to prevent clobbering.

export type Lang = "ar" | "en";

export type SettingsI18nRow = {
  lang: Lang;
  site_name: string;
  site_title: string;
  admin_sidebar_name: string;
  about_title: string;
  tagline: string;
  about_short: string;
  about_body: string;
  footer_text: string;
  seo_title: string;
  seo_description: string;
  address: string;
  sponsorship_text: string;
  hero_tagline: string;
  hero_title: string;
  hero_description: string;
  hero_quote: string;
  home_about_title: string;
  home_about_text: string;
};

const EMPTY: Omit<SettingsI18nRow, "lang"> = {
  site_name: "",
  site_title: "",
  admin_sidebar_name: "",
  about_title: "",
  tagline: "",
  about_short: "",
  about_body: "",
  footer_text: "",
  seo_title: "",
  seo_description: "",
  address: "",
  sponsorship_text: "",
  hero_tagline: "",
  hero_title: "",
  hero_description: "",
  hero_quote: "",
  home_about_title: "",
  home_about_text: "",
};

const HERO_KEYS = ["hero_tagline", "hero_title", "hero_description", "hero_quote"] as const;
const HOME_ABOUT_KEYS = ["home_about_title", "home_about_text"] as const;
const ABOUT_KEYS = ["about_title", "tagline", "about_short", "about_body"] as const;

function base(existing: Partial<SettingsI18nRow> | null | undefined): Omit<SettingsI18nRow, "lang"> {
  const e = existing ?? {};
  const out: any = { ...EMPTY };
  for (const k of Object.keys(EMPTY) as (keyof typeof EMPTY)[]) {
    out[k] = (e as any)[k] ?? "";
  }
  return out;
}

/** Merge for the Homepage admin: patch hero_* + homepage about fields, preserve everything else. */
export function mergeHomepageI18n(
  lang: Lang,
  existing: Partial<SettingsI18nRow> | null | undefined,
  patch: Partial<Pick<SettingsI18nRow, (typeof HERO_KEYS)[number] | (typeof HOME_ABOUT_KEYS)[number]>>,
): SettingsI18nRow {
  const merged = base(existing);
  for (const k of [...HERO_KEYS, ...HOME_ABOUT_KEYS]) merged[k] = patch[k] ?? merged[k];
  return { lang, ...merged };
}

/** Merge for the About admin: patch about_* + tagline, preserve hero_* and sponsorship_text. */
export function mergeAboutI18n(
  lang: Lang,
  existing: Partial<SettingsI18nRow> | null | undefined,
  patch: Partial<Pick<SettingsI18nRow, (typeof ABOUT_KEYS)[number]>>,
): SettingsI18nRow {
  const merged = base(existing);
  for (const k of ABOUT_KEYS) merged[k] = patch[k] ?? merged[k];
  return { lang, ...merged };
}
