import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

type Dict = Record<string, { ar: string; en: string }>;

const dict: Dict = {
  "nav.home": { ar: "الرئيسية", en: "Home" },
  "nav.about": { ar: "من نحن", en: "About" },
  "nav.focus": { ar: "مجالات العمل", en: "Focus Areas" },
  "nav.projects": { ar: "المشاريع", en: "Projects" },
  "nav.partners": { ar: "الشركاء", en: "Partners" },
  "nav.news": { ar: "الأخبار", en: "News" },
  "nav.contact": { ar: "تواصل معنا", en: "Contact" },
  "nav.admin": { ar: "لوحة التحكم", en: "Admin" },
  "nav.signin": { ar: "تسجيل الدخول", en: "Sign in" },
  "nav.signout": { ar: "تسجيل الخروج", en: "Sign out" },
  "lang.toggle": { ar: "EN", en: "عربي" },
  "common.readMore": { ar: "اقرأ المزيد", en: "Read more" },
  "common.viewAll": { ar: "عرض الكل", en: "View all" },
  "common.loading": { ar: "جار التحميل...", en: "Loading..." },
  "common.save": { ar: "حفظ", en: "Save" },
  "common.cancel": { ar: "إلغاء", en: "Cancel" },
  "common.delete": { ar: "حذف", en: "Delete" },
  "common.edit": { ar: "تعديل", en: "Edit" },
  "common.create": { ar: "إنشاء", en: "Create" },
  "common.back": { ar: "رجوع", en: "Back" },
  "home.heroCta": { ar: "تعرف على مشاريعنا", en: "Explore our projects" },
  "home.stats": { ar: "بالأرقام", en: "By the numbers" },
  "home.focus": { ar: "مجالات عملنا", en: "Our focus areas" },
  "home.projects": { ar: "أحدث المشاريع", en: "Latest projects" },
  "home.partners": { ar: "شركاؤنا", en: "Our partners" },
  "home.news": { ar: "آخر الأخبار", en: "Latest news" },
  "admin.dashboard": { ar: "لوحة التحكم", en: "Dashboard" },
  "admin.settings": { ar: "الإعدادات", en: "Settings" },
  "admin.pages": { ar: "الصفحات", en: "Pages" },
  "admin.focus": { ar: "مجالات العمل", en: "Focus Areas" },
  "admin.projects": { ar: "المشاريع", en: "Projects" },
  "admin.partners": { ar: "الشركاء", en: "Partners" },
  "admin.news": { ar: "الأخبار", en: "News" },
  "admin.stats": { ar: "إحصائيات الرئيسية", en: "Homepage Stats" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict | string) => string;
  dir: "rtl" | "ltr";
}

const Ctx = createContext<I18nCtx | null>(null);

const STORAGE_KEY = "lk_lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && (localStorage.getItem(STORAGE_KEY) as Lang | null)) || null;
    if (stored === "ar" || stored === "en") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: string) => {
    const entry = dict[key as keyof typeof dict];
    return entry ? entry[lang] : key;
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

/** Pick localized field from a list of i18n rows */
export function pickI18n<T extends { lang: string }>(rows: T[] | null | undefined, lang: Lang): T | undefined {
  if (!rows || rows.length === 0) return undefined;
  return rows.find((r) => r.lang === lang) ?? rows.find((r) => r.lang === "ar") ?? rows[0];
}
