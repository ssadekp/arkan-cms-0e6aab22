-- ABOUT VALUES (mission / vision / values)
CREATE TABLE public.about_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon text,
  image text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.about_values TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.about_values TO authenticated;
GRANT ALL ON public.about_values TO service_role;
ALTER TABLE public.about_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY about_values_public_read ON public.about_values
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY about_values_staff_read ON public.about_values
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY about_values_staff_write ON public.about_values
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER about_values_set_updated_at BEFORE UPDATE ON public.about_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.about_values_i18n (
  value_id uuid NOT NULL REFERENCES public.about_values(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  PRIMARY KEY (value_id, lang)
);
GRANT SELECT ON public.about_values_i18n TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.about_values_i18n TO authenticated;
GRANT ALL ON public.about_values_i18n TO service_role;
ALTER TABLE public.about_values_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY about_values_i18n_public_read ON public.about_values_i18n
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY about_values_i18n_staff_write ON public.about_values_i18n
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- TEAM MEMBERS
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.team_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_members_public_read ON public.team_members
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY team_members_staff_read ON public.team_members
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY team_members_staff_write ON public.team_members
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER team_members_set_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.team_members_i18n (
  member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  PRIMARY KEY (member_id, lang)
);
GRANT SELECT ON public.team_members_i18n TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members_i18n TO authenticated;
GRANT ALL ON public.team_members_i18n TO service_role;
ALTER TABLE public.team_members_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_members_i18n_public_read ON public.team_members_i18n
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY team_members_i18n_staff_write ON public.team_members_i18n
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));