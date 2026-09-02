CREATE TABLE public.articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  hero_image text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.articles_i18n (
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  PRIMARY KEY (article_id, lang)
);

GRANT SELECT ON public.articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles TO authenticated;
GRANT ALL ON public.articles TO service_role;
GRANT SELECT ON public.articles_i18n TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles_i18n TO authenticated;
GRANT ALL ON public.articles_i18n TO service_role;

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles_i18n ENABLE ROW LEVEL SECURITY;

CREATE POLICY articles_public_read ON public.articles FOR SELECT USING (published OR public.is_staff(auth.uid()));
CREATE POLICY articles_staff_write ON public.articles FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY articles_i18n_public_read ON public.articles_i18n FOR SELECT USING (true);
CREATE POLICY articles_i18n_staff_write ON public.articles_i18n FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER articles_set_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();