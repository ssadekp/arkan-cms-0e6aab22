REVOKE SELECT ON public.contact_forms FROM anon, authenticated;

GRANT SELECT (id, slug, title_en, title_ar, description_en, description_ar, success_message_en, success_message_ar, published, created_at, updated_at) ON public.contact_forms TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.contact_forms TO authenticated;
GRANT ALL ON public.contact_forms TO service_role;