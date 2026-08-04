DROP POLICY IF EXISTS "public_read_site_media" ON storage.objects;
DROP POLICY IF EXISTS "public_read_charity_docs" ON storage.objects;
DROP POLICY IF EXISTS "public_read_user_avatars" ON storage.objects;

CREATE POLICY "staff_list_site_media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'site-media' AND public.is_staff(auth.uid()));

CREATE POLICY "staff_list_charity_docs" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'charity-docs' AND public.is_staff(auth.uid()));

CREATE POLICY "staff_list_user_avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-avatars' AND public.is_staff(auth.uid()));