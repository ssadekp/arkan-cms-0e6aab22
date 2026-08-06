ALTER TABLE public.site_settings_i18n ADD COLUMN IF NOT EXISTS site_title text NOT NULL DEFAULT '';
ALTER TABLE public.team_members_i18n ADD COLUMN IF NOT EXISTS position text NOT NULL DEFAULT '';