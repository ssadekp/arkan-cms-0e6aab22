
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid)           FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid)     FROM anon, public;
