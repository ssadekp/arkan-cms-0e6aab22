CREATE TABLE public.video_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  cover_image text,
  videos jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_albums TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_albums TO authenticated;
GRANT ALL ON public.video_albums TO service_role;

ALTER TABLE public.video_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published video albums"
  ON public.video_albums FOR SELECT
  USING (published = true);

CREATE POLICY "Staff can manage video albums"
  ON public.video_albums FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER video_albums_set_updated_at
  BEFORE UPDATE ON public.video_albums
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.video_albums_i18n (
  album_id uuid NOT NULL REFERENCES public.video_albums(id) ON DELETE CASCADE,
  lang app_language NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  PRIMARY KEY (album_id, lang)
);

GRANT SELECT ON public.video_albums_i18n TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_albums_i18n TO authenticated;
GRANT ALL ON public.video_albums_i18n TO service_role;

ALTER TABLE public.video_albums_i18n ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read video album translations"
  ON public.video_albums_i18n FOR SELECT
  USING (true);

CREATE POLICY "Staff can manage video album translations"
  ON public.video_albums_i18n FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
