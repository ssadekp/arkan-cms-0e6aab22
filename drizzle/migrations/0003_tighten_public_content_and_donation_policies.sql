DROP POLICY IF EXISTS "Public can read video album translations" ON public.video_albums_i18n;
CREATE POLICY "Public can read published video album translations"
  ON public.video_albums_i18n FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.video_albums a
    WHERE a.id = video_albums_i18n.album_id AND a.published = true
  ));

DROP POLICY IF EXISTS team_members_i18n_public_read ON public.team_members_i18n;
CREATE POLICY team_members_i18n_public_read ON public.team_members_i18n
  FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_members m
    WHERE m.id = team_members_i18n.member_id AND m.published = true
  ));

DROP POLICY IF EXISTS "donations public insert" ON public.donations;
CREATE POLICY "donations public insert" ON public.donations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(btrim(name)) BETWEEN 2 AND 100
    AND char_length(btrim(phone)) BETWEEN 6 AND 30
    AND phone ~ '^[0-9+()[:space:]-]+$'
    AND (
      email IS NULL OR email = '' OR (
        char_length(btrim(email)) <= 255
        AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
      )
    )
    AND amount > 0 AND amount <= 10000000
    AND char_length(btrim(currency)) BETWEEN 1 AND 12
    AND (note IS NULL OR char_length(note) <= 1000)
    AND (user_agent IS NULL OR char_length(user_agent) <= 500)
    AND status = 'new'
    AND created_at >= now() - interval '10 minutes'
    AND created_at <= now() + interval '1 minute'
    AND updated_at >= now() - interval '10 minutes'
    AND updated_at <= now() + interval '1 minute'
  );