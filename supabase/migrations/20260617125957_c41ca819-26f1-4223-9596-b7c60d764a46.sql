DROP POLICY IF EXISTS user_roles_admin_write ON public.user_roles;

-- Admins can manage roles, but cannot grant or modify super_admin
CREATE POLICY user_roles_admin_write ON public.user_roles
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND role::text <> 'super_admin'
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  AND role::text <> 'super_admin'
);

-- Super admins retain full control over all role assignments
CREATE POLICY user_roles_super_admin_write ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));