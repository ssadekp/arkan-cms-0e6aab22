// Site modules that can be hidden from both the public site and the admin panel.
// Controlled by site_settings.hidden_modules (text[]).

export interface SiteModule {
  key: string;
  en: string;
  ar: string;
  /** Public route prefix, used to filter navigation links. */
  url: string;
  /** Admin route prefixes hidden together with the module. */
  admin: string[];
}

export const SITE_MODULES: SiteModule[] = [
  { key: "about", en: "About", ar: "من نحن", url: "/about", admin: ["/admin/about"] },
  { key: "focus_areas", en: "Focus Areas", ar: "مجالات العمل", url: "/focus-areas", admin: ["/admin/focus-areas"] },
  { key: "projects", en: "Projects", ar: "المشروعات", url: "/projects", admin: ["/admin/projects", "/admin/tags"] },
  { key: "partners", en: "Partners", ar: "الجمعيات والمؤسسات المشاركة", url: "/partners", admin: ["/admin/partners"] },
  { key: "news", en: "News", ar: "الأخبار", url: "/news", admin: ["/admin/news"] },
  { key: "articles", en: "Articles", ar: "المقالات", url: "/articles", admin: ["/admin/articles"] },
  { key: "albums", en: "Photo Albums", ar: "ألبوم الصور", url: "/albums", admin: ["/admin/albums"] },
  { key: "video_albums", en: "Video Albums", ar: "ألبوم الفيديو", url: "/video-albums", admin: ["/admin/video-albums"] },
  { key: "documents", en: "Documents", ar: "الوثائق والتقارير", url: "/resources", admin: ["/admin/documents"] },
  { key: "contact", en: "Contact", ar: "تواصل معنا", url: "/contact", admin: ["/admin/contact", "/admin/forms"] },
  { key: "donate", en: "Donations", ar: "التبرعات", url: "/donate", admin: ["/admin/donations"] },
  { key: "faq", en: "FAQ", ar: "الأسئلة الشائعة", url: "/faq", admin: ["/admin/faq"] },
];

export const MODULE_KEYS = SITE_MODULES.map((m) => m.key);

export function isModuleHidden(hidden: string[] | null | undefined, key: string) {
  if (!hidden || hidden.length === 0) return false;
  return hidden.includes("all") || hidden.includes(key);
}

/** True when a public nav url belongs to a hidden module. */
export function isNavUrlHidden(hidden: string[] | null | undefined, url: string) {
  if (!hidden || hidden.length === 0) return false;
  if (/^https?:\/\//i.test(url)) return false;
  const mod = SITE_MODULES.find((m) => url === m.url || url.startsWith(m.url + "/"));
  return mod ? isModuleHidden(hidden, mod.key) : false;
}

/** True when an admin route belongs to a hidden module. */
export function isAdminPathHidden(hidden: string[] | null | undefined, path: string) {
  if (!hidden || hidden.length === 0) return false;
  const mod = SITE_MODULES.find((m) => m.admin.some((a) => path === a || path.startsWith(a + "/")));
  return mod ? isModuleHidden(hidden, mod.key) : false;
}
