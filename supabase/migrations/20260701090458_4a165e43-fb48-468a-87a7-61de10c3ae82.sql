
-- Ensure a site_settings row exists so visitor counter and settings save works
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Make the visitor counter self-heal if the row is missing, and always
-- return starting_number + hits so the count begins after the starting number.
CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  total bigint;
  enabled boolean;
  start_num bigint;
  hits_now bigint;
BEGIN
  INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

  SELECT COALESCE(visitor_counter_enabled, true),
         COALESCE(visitor_count_start, 0),
         COALESCE(visitor_hits, 0)
    INTO enabled, start_num, hits_now
    FROM public.site_settings WHERE id = 1;

  IF enabled IS DISTINCT FROM true THEN
    RETURN start_num + hits_now;
  END IF;

  UPDATE public.site_settings
    SET visitor_hits = COALESCE(visitor_hits, 0) + 1
    WHERE id = 1
    RETURNING COALESCE(visitor_count_start, 0) + visitor_hits INTO total;

  RETURN COALESCE(total, start_num + hits_now + 1);
END;
$function$;
