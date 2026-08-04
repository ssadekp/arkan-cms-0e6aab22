-- 1. Lock down SECURITY DEFINER / internal helper functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.promote_first_user_to_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- Role helpers are used inside RLS policies for signed-in users only
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;

-- Visitor counter is intentionally public (called from the site footer)
REVOKE ALL ON FUNCTION public.increment_visitor_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_visitor_count() TO anon, authenticated;

-- 2. Prevent admin privilege escalation on user_roles: only super admins manage roles
DROP POLICY IF EXISTS user_roles_admin_write ON public.user_roles;

-- 3. Explicit SELECT policies for the intentionally public storage buckets
DROP POLICY IF EXISTS "public_read_site_media" ON storage.objects;
CREATE POLICY "public_read_site_media" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'site-media');

DROP POLICY IF EXISTS "public_read_charity_docs" ON storage.objects;
CREATE POLICY "public_read_charity_docs" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'charity-docs');

DROP POLICY IF EXISTS "public_read_user_avatars" ON storage.objects;
CREATE POLICY "public_read_user_avatars" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'user-avatars');

-- 4. Extra hardening for anonymous contact submissions (staff-only reads unchanged)
ALTER TABLE public.contact_messages
  DROP CONSTRAINT IF EXISTS contact_messages_payload_size_chk;
ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_messages_payload_size_chk
  CHECK (
    length(name) <= 200
    AND length(email) <= 320
    AND length(message) <= 5000
    AND (subject IS NULL OR length(subject) <= 300)
  );