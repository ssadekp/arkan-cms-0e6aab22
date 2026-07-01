
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS visitor_counter_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS visitor_count_start integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS visitor_hits bigint NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total bigint;
  enabled boolean;
BEGIN
  SELECT visitor_counter_enabled INTO enabled FROM public.site_settings WHERE id = 1;
  IF enabled IS DISTINCT FROM true THEN
    SELECT COALESCE(visitor_count_start,0) + COALESCE(visitor_hits,0) INTO total
      FROM public.site_settings WHERE id = 1;
    RETURN COALESCE(total, 0);
  END IF;

  UPDATE public.site_settings
    SET visitor_hits = COALESCE(visitor_hits, 0) + 1
    WHERE id = 1
    RETURNING COALESCE(visitor_count_start,0) + visitor_hits INTO total;

  RETURN COALESCE(total, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_visitor_count() TO anon, authenticated;
