
-- 1) Documents: bilingual titles
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS title_ar text NOT NULL DEFAULT '';
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS title_en text NOT NULL DEFAULT '';
UPDATE public.documents SET title_ar = COALESCE(NULLIF(title_ar, ''), title), title_en = COALESCE(NULLIF(title_en, ''), title) WHERE title IS NOT NULL;
ALTER TABLE public.documents DROP COLUMN IF EXISTS title;

-- 2) Social links table
CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name text NOT NULL,
  platform_icon text NOT NULL,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.social_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_links TO authenticated;
GRANT ALL ON public.social_links TO service_role;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_links public read" ON public.social_links FOR SELECT USING (true);
CREATE POLICY "social_links staff write" ON public.social_links FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 3) Avatar storage policies (bucket created via tool)
CREATE POLICY "user-avatars public read" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');
CREATE POLICY "user-avatars staff write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'user-avatars' AND public.is_staff(auth.uid()));
CREATE POLICY "user-avatars staff update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'user-avatars' AND public.is_staff(auth.uid()));
CREATE POLICY "user-avatars staff delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-avatars' AND public.is_staff(auth.uid()));
