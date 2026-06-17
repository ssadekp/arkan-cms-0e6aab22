ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS sponsorship_url text;
ALTER TABLE public.site_settings_i18n ADD COLUMN IF NOT EXISTS sponsorship_text text;

GRANT SELECT (sponsorship_url) ON public.site_settings TO anon, authenticated;
GRANT SELECT (sponsorship_text) ON public.site_settings_i18n TO anon, authenticated;