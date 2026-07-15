CREATE TABLE public.theme_tokens (
  id smallint PRIMARY KEY DEFAULT 1,
  primary_hex text NOT NULL DEFAULT '#00A651',
  ink_hex text NOT NULL DEFAULT '#0B0F14',
  background_hex text NOT NULL DEFAULT '#FDFDFB',
  foreground_hex text NOT NULL DEFAULT '#12161C',
  surface_hex text NOT NULL DEFAULT '#F7F7F4',
  accent_hex text NOT NULL DEFAULT '#E6F7EE',
  destructive_hex text NOT NULL DEFAULT '#DC2626',
  border_hex text NOT NULL DEFAULT '#E5E7EB',
  radius_rem numeric NOT NULL DEFAULT 1.0,
  font_display text NOT NULL DEFAULT 'Manrope',
  font_body text NOT NULL DEFAULT 'Manrope',
  font_arabic text NOT NULL DEFAULT 'Tajawal',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT theme_tokens_singleton CHECK (id = 1)
);

GRANT SELECT ON public.theme_tokens TO anon, authenticated;
GRANT ALL ON public.theme_tokens TO service_role;

ALTER TABLE public.theme_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "theme_tokens public read"
  ON public.theme_tokens FOR SELECT
  USING (true);

CREATE POLICY "theme_tokens admin update"
  ON public.theme_tokens FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE POLICY "theme_tokens admin insert"
  ON public.theme_tokens FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE TRIGGER theme_tokens_updated_at
  BEFORE UPDATE ON public.theme_tokens
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.theme_tokens (id) VALUES (1) ON CONFLICT DO NOTHING;