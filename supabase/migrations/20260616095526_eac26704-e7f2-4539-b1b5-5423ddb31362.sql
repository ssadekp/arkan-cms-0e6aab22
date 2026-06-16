
CREATE TYPE public.document_category AS ENUM ('regulation', 'form', 'achievement');

CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category public.document_category NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents are publicly readable"
  ON public.documents FOR SELECT
  USING (true);

CREATE POLICY "Staff can insert documents"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update documents"
  ON public.documents FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete documents"
  ON public.documents FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

-- Storage policies for charity-docs bucket
CREATE POLICY "charity-docs public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'charity-docs');

CREATE POLICY "charity-docs staff insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'charity-docs' AND public.is_staff(auth.uid()));

CREATE POLICY "charity-docs staff update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'charity-docs' AND public.is_staff(auth.uid()));

CREATE POLICY "charity-docs staff delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'charity-docs' AND public.is_staff(auth.uid()));
