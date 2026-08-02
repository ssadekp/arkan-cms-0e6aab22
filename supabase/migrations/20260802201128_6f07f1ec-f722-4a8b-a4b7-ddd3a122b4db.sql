ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS about_image text,
  ADD COLUMN IF NOT EXISTS home_about_image text;

ALTER TABLE public.site_settings_i18n
  ADD COLUMN IF NOT EXISTS home_about_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS home_about_text text NOT NULL DEFAULT '';

UPDATE public.site_settings_i18n
  SET home_about_title = COALESCE(NULLIF(home_about_title,''), about_title),
      home_about_text = COALESCE(NULLIF(home_about_text,''), about_short)
  WHERE setting_id = 1;

CREATE TABLE IF NOT EXISTS public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  cover_image text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.albums TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.albums TO authenticated;
GRANT ALL ON public.albums TO service_role;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
CREATE POLICY "albums_public_read" ON public.albums FOR SELECT USING (published = true);
CREATE POLICY "albums_staff_all" ON public.albums FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.albums_i18n (
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  PRIMARY KEY (album_id, lang)
);

GRANT SELECT ON public.albums_i18n TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.albums_i18n TO authenticated;
GRANT ALL ON public.albums_i18n TO service_role;
ALTER TABLE public.albums_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "albums_i18n_public_read" ON public.albums_i18n FOR SELECT USING (true);
CREATE POLICY "albums_i18n_staff_all" ON public.albums_i18n FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER albums_set_updated_at BEFORE UPDATE ON public.albums FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();