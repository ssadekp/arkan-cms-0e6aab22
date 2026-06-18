
-- 1. Homepage section visibility toggles on site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS show_all_sections boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_focus_areas boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_projects boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_news boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_documents boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_partners boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_stats boolean NOT NULL DEFAULT true;

-- 2. Menu builder
CREATE TABLE IF NOT EXISTS public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.menu_items(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  label_en text NOT NULL DEFAULT '',
  label_ar text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '/',
  target text NOT NULL DEFAULT '_self' CHECK (target IN ('_self','_blank')),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.menu_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT ALL ON public.menu_items TO service_role;

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_items_public_read" ON public.menu_items
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "menu_items_staff_read_all" ON public.menu_items
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "menu_items_staff_write" ON public.menu_items
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER menu_items_set_updated_at BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Custom contact forms
CREATE TABLE IF NOT EXISTS public.contact_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title_en text NOT NULL DEFAULT '',
  title_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  success_message_en text NOT NULL DEFAULT 'Thank you for your submission.',
  success_message_ar text NOT NULL DEFAULT 'شكراً لتواصلكم معنا.',
  notify_email text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.contact_forms TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.contact_forms TO authenticated;
GRANT ALL ON public.contact_forms TO service_role;

ALTER TABLE public.contact_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_forms_public_read" ON public.contact_forms
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "contact_forms_staff_read_all" ON public.contact_forms
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "contact_forms_staff_write" ON public.contact_forms
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER contact_forms_set_updated_at BEFORE UPDATE ON public.contact_forms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.contact_form_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.contact_forms(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  field_key text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text','email','phone','textarea','select','radio','checkbox','file','date','number')),
  label_en text NOT NULL DEFAULT '',
  label_ar text NOT NULL DEFAULT '',
  placeholder_en text NOT NULL DEFAULT '',
  placeholder_ar text NOT NULL DEFAULT '',
  required boolean NOT NULL DEFAULT false,
  options_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (form_id, field_key)
);

GRANT SELECT ON public.contact_form_fields TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.contact_form_fields TO authenticated;
GRANT ALL ON public.contact_form_fields TO service_role;

ALTER TABLE public.contact_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_form_fields_public_read" ON public.contact_form_fields
  FOR SELECT TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM public.contact_forms f WHERE f.id = form_id AND f.published = true)
  );
CREATE POLICY "contact_form_fields_staff_read_all" ON public.contact_form_fields
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "contact_form_fields_staff_write" ON public.contact_form_fields
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER contact_form_fields_set_updated_at BEFORE UPDATE ON public.contact_form_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.contact_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.contact_forms(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  files jsonb NOT NULL DEFAULT '[]'::jsonb,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_form_submissions TO anon, authenticated;
GRANT SELECT, DELETE ON public.contact_form_submissions TO authenticated;
GRANT ALL ON public.contact_form_submissions TO service_role;

ALTER TABLE public.contact_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_form_submissions_public_insert" ON public.contact_form_submissions
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.contact_forms f WHERE f.id = form_id AND f.published = true)
  );
CREATE POLICY "contact_form_submissions_staff_read" ON public.contact_form_submissions
  FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "contact_form_submissions_staff_delete" ON public.contact_form_submissions
  FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));
