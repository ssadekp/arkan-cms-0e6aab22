
-- 1) Translatable address on settings
ALTER TABLE public.site_settings_i18n
  ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '';

-- backfill from existing single address
UPDATE public.site_settings_i18n i
SET address = COALESCE(s.contact_address, '')
FROM public.site_settings s
WHERE i.setting_id = s.id AND i.address = '';

ALTER TABLE public.site_settings DROP COLUMN IF EXISTS contact_address;

-- 2) Project status enum + column
DO $$ BEGIN
  CREATE TYPE public.project_status AS ENUM ('planned','ongoing','completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS status public.project_status NOT NULL DEFAULT 'ongoing';

-- 3) Seed main-menu pages (idempotent)
WITH seed(slug, nav_order, title_ar, title_en) AS (
  VALUES
    ('about',       1, 'من نحن',           'About'),
    ('focus-areas', 2, 'مجالات العمل',    'Focus Areas'),
    ('projects',    3, 'المشاريع',         'Projects'),
    ('partners',    4, 'الشركاء',           'Partners'),
    ('news',        5, 'الأخبار',           'News'),
    ('contact',     6, 'اتصل بنا',          'Contact')
)
INSERT INTO public.pages (slug, nav_order, show_in_nav, published)
SELECT s.slug, s.nav_order, false, true
FROM seed s
WHERE NOT EXISTS (SELECT 1 FROM public.pages p WHERE p.slug = s.slug);

INSERT INTO public.pages_i18n (page_id, lang, title, body, seo_title, seo_description)
SELECT p.id, 'ar'::app_language, s.title_ar, '', s.title_ar, ''
FROM public.pages p
JOIN ( VALUES
  ('about','من نحن'),('focus-areas','مجالات العمل'),('projects','المشاريع'),
  ('partners','الشركاء'),('news','الأخبار'),('contact','اتصل بنا')
) s(slug, title_ar) ON s.slug = p.slug
ON CONFLICT (page_id, lang) DO NOTHING;

INSERT INTO public.pages_i18n (page_id, lang, title, body, seo_title, seo_description)
SELECT p.id, 'en'::app_language, s.title_en, '', s.title_en, ''
FROM public.pages p
JOIN ( VALUES
  ('about','About'),('focus-areas','Focus Areas'),('projects','Projects'),
  ('partners','Partners'),('news','News'),('contact','Contact')
) s(slug, title_en) ON s.slug = p.slug
ON CONFLICT (page_id, lang) DO NOTHING;
