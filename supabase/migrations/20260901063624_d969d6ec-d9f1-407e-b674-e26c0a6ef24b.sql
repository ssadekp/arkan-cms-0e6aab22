ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE public.projects_i18n
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';