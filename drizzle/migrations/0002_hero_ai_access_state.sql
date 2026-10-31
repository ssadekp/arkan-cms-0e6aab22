CREATE TABLE public.hero_ai_access_state (
  id text PRIMARY KEY,
  message text NOT NULL,
  blocked_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.hero_ai_access_state TO service_role;
REVOKE ALL ON public.hero_ai_access_state FROM anon, authenticated;
ALTER TABLE public.hero_ai_access_state ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.hero_ai_access_state IS 'Server-only persistent AI access denial circuit breaker; administrators explicitly acknowledge restored access before a fresh request.';