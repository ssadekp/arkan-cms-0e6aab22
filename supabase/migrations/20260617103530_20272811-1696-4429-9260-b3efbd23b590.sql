
-- 1. profiles.status: prevent self-update of privileged column via column-level grants
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, avatar_url) ON public.profiles TO authenticated;
-- service_role keeps full access (admin updates go through supabaseAdmin).

-- 2. site_settings: replace blanket SELECT with explicit safe-column grants.
REVOKE SELECT ON public.site_settings FROM anon, authenticated;
GRANT SELECT (
  id, logo_url, favicon_url, primary_color, accent_color,
  default_language, contact_email, contact_phone,
  seo_og_image, map_embed_url, social_links, updated_at
) ON public.site_settings TO anon, authenticated;
-- RLS SELECT policy `site_settings_public_read` (USING true) is preserved;
-- column privileges now constrain which fields are visible. Newly added
-- columns will be hidden until explicitly granted.

-- 3. contact_messages: tighten the "Anyone can submit" INSERT rule.
DROP POLICY IF EXISTS "Anyone can submit" ON public.contact_messages;
CREATE POLICY "Anyone can submit"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 200
    AND length(btrim(email)) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(btrim(message)) BETWEEN 1 AND 5000
    AND (subject IS NULL OR length(subject) <= 300)
  );

-- 4. Public storage buckets: remove broad listing capability. Public file
-- downloads continue to work via the public CDN endpoint, which does not
-- consult storage.objects RLS.
DROP POLICY IF EXISTS "charity-docs public read" ON storage.objects;
DROP POLICY IF EXISTS "site_media_public_read"   ON storage.objects;
DROP POLICY IF EXISTS "user-avatars public read" ON storage.objects;

-- 5. Internal trigger helpers should not be callable from the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user()              FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.promote_first_user_to_admin()  FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()               FROM anon, authenticated, public;
-- Role-check helpers (has_role, is_staff, is_super_admin) remain executable
-- because RLS policies invoke them as the calling role.
