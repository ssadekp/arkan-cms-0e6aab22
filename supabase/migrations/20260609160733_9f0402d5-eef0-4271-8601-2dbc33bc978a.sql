
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');
CREATE TYPE public.app_language AS ENUM ('ar', 'en');

-- =========================================================
-- HELPER: updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'))
$$;

CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Auto-promote the very first user to admin
CREATE OR REPLACE FUNCTION public.promote_first_user_to_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_promote_first AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.promote_first_user_to_admin();

-- =========================================================
-- SITE SETTINGS (singleton row id=1)
-- =========================================================
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#16a34a',
  accent_color TEXT NOT NULL DEFAULT '#0f1e3d',
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_language public.app_language NOT NULL DEFAULT 'ar',
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  seo_og_image TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_public_read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_write" ON public.site_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.site_settings_i18n (
  setting_id INT NOT NULL REFERENCES public.site_settings(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  site_name TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  about_short TEXT NOT NULL DEFAULT '',
  footer_text TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (setting_id, lang)
);
GRANT SELECT ON public.site_settings_i18n TO anon, authenticated;
GRANT ALL ON public.site_settings_i18n TO service_role;
ALTER TABLE public.site_settings_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_i18n_public_read" ON public.site_settings_i18n FOR SELECT USING (true);
CREATE POLICY "site_settings_i18n_admin_write" ON public.site_settings_i18n FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- HOMEPAGE STATS
-- =========================================================
CREATE TABLE public.homepage_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  icon TEXT,
  value TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homepage_stats TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_stats TO authenticated;
GRANT ALL ON public.homepage_stats TO service_role;
ALTER TABLE public.homepage_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_stats_public_read" ON public.homepage_stats FOR SELECT USING (true);
CREATE POLICY "homepage_stats_staff_write" ON public.homepage_stats FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER homepage_stats_updated_at BEFORE UPDATE ON public.homepage_stats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.homepage_stats_i18n (
  stat_id UUID NOT NULL REFERENCES public.homepage_stats(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (stat_id, lang)
);
GRANT SELECT ON public.homepage_stats_i18n TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homepage_stats_i18n TO authenticated;
GRANT ALL ON public.homepage_stats_i18n TO service_role;
ALTER TABLE public.homepage_stats_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_stats_i18n_public_read" ON public.homepage_stats_i18n FOR SELECT USING (true);
CREATE POLICY "homepage_stats_i18n_staff_write" ON public.homepage_stats_i18n FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- PAGES (custom navigation pages)
-- =========================================================
CREATE TABLE public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  hero_image TEXT,
  show_in_nav BOOLEAN NOT NULL DEFAULT false,
  nav_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pages TO authenticated;
GRANT ALL ON public.pages TO service_role;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pages_public_read" ON public.pages FOR SELECT USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "pages_staff_write" ON public.pages FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER pages_updated_at BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.pages_i18n (
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (page_id, lang)
);
GRANT SELECT ON public.pages_i18n TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.pages_i18n TO authenticated;
GRANT ALL ON public.pages_i18n TO service_role;
ALTER TABLE public.pages_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pages_i18n_public_read" ON public.pages_i18n FOR SELECT USING (true);
CREATE POLICY "pages_i18n_staff_write" ON public.pages_i18n FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- FOCUS AREAS
-- =========================================================
CREATE TABLE public.focus_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  hero_image TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.focus_areas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.focus_areas TO authenticated;
GRANT ALL ON public.focus_areas TO service_role;
ALTER TABLE public.focus_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "focus_areas_public_read" ON public.focus_areas FOR SELECT USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "focus_areas_staff_write" ON public.focus_areas FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER focus_areas_updated_at BEFORE UPDATE ON public.focus_areas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.focus_areas_i18n (
  focus_area_id UUID NOT NULL REFERENCES public.focus_areas(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (focus_area_id, lang)
);
GRANT SELECT ON public.focus_areas_i18n TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.focus_areas_i18n TO authenticated;
GRANT ALL ON public.focus_areas_i18n TO service_role;
ALTER TABLE public.focus_areas_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "focus_areas_i18n_public_read" ON public.focus_areas_i18n FOR SELECT USING (true);
CREATE POLICY "focus_areas_i18n_staff_write" ON public.focus_areas_i18n FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- PARTNERS (associations)
-- =========================================================
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  show_on_home BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_public_read" ON public.partners FOR SELECT USING (true);
CREATE POLICY "partners_staff_write" ON public.partners FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- TAGS
-- =========================================================
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_public_read" ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags_staff_write" ON public.tags FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.tags_i18n (
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (tag_id, lang)
);
GRANT SELECT ON public.tags_i18n TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tags_i18n TO authenticated;
GRANT ALL ON public.tags_i18n TO service_role;
ALTER TABLE public.tags_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tags_i18n_public_read" ON public.tags_i18n FOR SELECT USING (true);
CREATE POLICY "tags_i18n_staff_write" ON public.tags_i18n FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- PROJECTS
-- =========================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  hero_image TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  focus_area_id UUID REFERENCES public.focus_areas(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_public_read" ON public.projects FOR SELECT USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "projects_staff_write" ON public.projects FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.projects_i18n (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (project_id, lang)
);
GRANT SELECT ON public.projects_i18n TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects_i18n TO authenticated;
GRANT ALL ON public.projects_i18n TO service_role;
ALTER TABLE public.projects_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_i18n_public_read" ON public.projects_i18n FOR SELECT USING (true);
CREATE POLICY "projects_i18n_staff_write" ON public.projects_i18n FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.project_partners (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, partner_id)
);
GRANT SELECT ON public.project_partners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_partners TO authenticated;
GRANT ALL ON public.project_partners TO service_role;
ALTER TABLE public.project_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_partners_public_read" ON public.project_partners FOR SELECT USING (true);
CREATE POLICY "project_partners_staff_write" ON public.project_partners FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.project_tags (
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, tag_id)
);
GRANT SELECT ON public.project_tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_tags TO authenticated;
GRANT ALL ON public.project_tags TO service_role;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_tags_public_read" ON public.project_tags FOR SELECT USING (true);
CREATE POLICY "project_tags_staff_write" ON public.project_tags FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- =========================================================
-- NEWS
-- =========================================================
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  hero_image TEXT,
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_public_read" ON public.news FOR SELECT USING (published OR public.is_staff(auth.uid()));
CREATE POLICY "news_staff_write" ON public.news FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER news_updated_at BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.news_i18n (
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (news_id, lang)
);
GRANT SELECT ON public.news_i18n TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_i18n TO authenticated;
GRANT ALL ON public.news_i18n TO service_role;
ALTER TABLE public.news_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_i18n_public_read" ON public.news_i18n FOR SELECT USING (true);
CREATE POLICY "news_i18n_staff_write" ON public.news_i18n FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
