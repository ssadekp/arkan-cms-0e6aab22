
-- partners i18n
CREATE TABLE public.partners_i18n (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  lang text NOT NULL CHECK (lang IN ('ar','en')),
  name text NOT NULL DEFAULT '',
  UNIQUE(partner_id, lang)
);
GRANT SELECT ON public.partners_i18n TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners_i18n TO authenticated;
GRANT ALL ON public.partners_i18n TO service_role;
ALTER TABLE public.partners_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read partners_i18n" ON public.partners_i18n FOR SELECT USING (true);
CREATE POLICY "Staff manage partners_i18n" ON public.partners_i18n FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- focus area <-> partners
CREATE TABLE public.focus_area_partners (
  focus_area_id uuid NOT NULL REFERENCES public.focus_areas(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  PRIMARY KEY (focus_area_id, partner_id)
);
GRANT SELECT ON public.focus_area_partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_area_partners TO authenticated;
GRANT ALL ON public.focus_area_partners TO service_role;
ALTER TABLE public.focus_area_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read focus_area_partners" ON public.focus_area_partners FOR SELECT USING (true);
CREATE POLICY "Staff manage focus_area_partners" ON public.focus_area_partners FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- contact messages
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can read messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff can delete messages" ON public.contact_messages FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

-- ensure project status default so admin create works
ALTER TABLE public.projects ALTER COLUMN status SET DEFAULT 'planned';

-- map embed url on settings
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS map_embed_url text;
