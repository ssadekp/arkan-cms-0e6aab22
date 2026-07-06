ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hero_image text;
ALTER TABLE public.site_settings_i18n ADD COLUMN IF NOT EXISTS hero_quote text NOT NULL DEFAULT '';