-- FAQs
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs public read" ON public.faqs FOR SELECT USING (published = true);
CREATE POLICY "faqs staff manage" ON public.faqs FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER faqs_set_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.faqs_i18n (
  faq_id uuid NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
  lang public.app_language NOT NULL,
  question text NOT NULL DEFAULT '',
  answer text NOT NULL DEFAULT '',
  PRIMARY KEY (faq_id, lang)
);
GRANT SELECT ON public.faqs_i18n TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs_i18n TO authenticated;
GRANT ALL ON public.faqs_i18n TO service_role;
ALTER TABLE public.faqs_i18n ENABLE ROW LEVEL SECURITY;
CREATE POLICY "faqs_i18n public read" ON public.faqs_i18n FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.faqs f WHERE f.id = faq_id AND f.published = true));
CREATE POLICY "faqs_i18n staff manage" ON public.faqs_i18n FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- Donations
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'EGP',
  note text,
  status text NOT NULL DEFAULT 'new',
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.donations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations public insert" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "donations staff read" ON public.donations FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE POLICY "donations staff update" ON public.donations FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "donations staff delete" ON public.donations FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));
CREATE TRIGGER donations_set_updated_at BEFORE UPDATE ON public.donations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS donation_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS donation_amounts jsonb NOT NULL DEFAULT '[100,250,500,1000]'::jsonb,
  ADD COLUMN IF NOT EXISTS donation_currency text NOT NULL DEFAULT 'EGP';

ALTER TABLE public.site_settings_i18n
  ADD COLUMN IF NOT EXISTS donate_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS donate_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS donate_thanks text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS donate_payment_info text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS faq_title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS faq_description text NOT NULL DEFAULT '';

UPDATE public.site_settings_i18n SET
  donate_title = CASE WHEN lang = 'ar' THEN 'تبرع الآن' ELSE 'Donate Now' END,
  donate_description = CASE WHEN lang = 'ar' THEN 'تبرعك يصنع فرقًا حقيقيًا في حياة الأسر التي نخدمها.' ELSE 'Your gift makes a real difference for the families we serve.' END,
  donate_thanks = CASE WHEN lang = 'ar' THEN 'شكرًا لك! سيتواصل فريقنا معك لإتمام التبرع.' ELSE 'Thank you! Our team will contact you to complete your donation.' END,
  faq_title = CASE WHEN lang = 'ar' THEN 'الأسئلة الشائعة' ELSE 'Frequently Asked Questions' END
WHERE donate_title = '';

INSERT INTO public.faqs (sort_order, published) VALUES (1, true), (2, true), (3, true);
INSERT INTO public.faqs_i18n (faq_id, lang, question, answer)
SELECT f.id, 'ar', q.ar_q, q.ar_a FROM public.faqs f
JOIN (VALUES
  (1, 'كيف يمكنني التبرع؟', 'يمكنك التبرع عبر صفحة "تبرع الآن" بتعبئة النموذج، وسيتواصل معك فريقنا لإتمام العملية.'),
  (2, 'هل التبرعات معفاة من الضرائب؟', 'نعم، نوفر إيصالًا رسميًا لكل تبرع يمكن استخدامه للإعفاء الضريبي وفق القوانين المعمول بها.'),
  (3, 'كيف أتابع أثر تبرعي؟', 'ننشر تقارير دورية وأخبار المشروعات على الموقع، ويمكنك أيضًا التواصل معنا لمعرفة تفاصيل مشروع محدد.')
) AS q(ord, ar_q, ar_a) ON q.ord = f.sort_order;
INSERT INTO public.faqs_i18n (faq_id, lang, question, answer)
SELECT f.id, 'en', q.en_q, q.en_a FROM public.faqs f
JOIN (VALUES
  (1, 'How can I donate?', 'Use the Donate Now page to submit the short form and our team will contact you to complete your gift.'),
  (2, 'Are donations tax deductible?', 'Yes. We issue an official receipt for every donation that can be used for tax purposes where applicable.'),
  (3, 'How do I follow the impact of my gift?', 'We publish regular reports and project news on this website, and you can always contact us about a specific project.')
) AS q(ord, en_q, en_a) ON q.ord = f.sort_order;