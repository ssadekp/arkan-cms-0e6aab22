ALTER TABLE public.contact_form_fields
ADD COLUMN IF NOT EXISTS width text NOT NULL DEFAULT 'full'
CHECK (width IN ('full','half','third'));