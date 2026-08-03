ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS language_mode text NOT NULL DEFAULT 'dual',
  ADD COLUMN IF NOT EXISTS hidden_modules text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_language_mode_check;
ALTER TABLE public.site_settings
  ADD CONSTRAINT site_settings_language_mode_check CHECK (language_mode IN ('single','dual'));