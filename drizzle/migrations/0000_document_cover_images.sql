ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS image_url text;
COMMENT ON COLUMN public.documents.image_url IS 'Optional cover image displayed on resource document cards.';