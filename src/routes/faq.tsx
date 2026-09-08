import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getFaqs } from "@/lib/support.functions";
import { getSiteData } from "@/lib/content.functions";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HelpCircle, Search, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Lam7et Khair Foundation" },
      { name: "description", content: "Answers to the most common questions about our programs, donations and volunteering." },
      { property: "og:title", content: "FAQ — Lam7et Khair Foundation" },
      { property: "og:description", content: "Answers to the most common questions about our programs, donations and volunteering." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const fn = useServerFn(getFaqs);
  const siteFn = useServerFn(getSiteData);
  const { data } = useQuery({ queryKey: ["faqs"], queryFn: () => fn(), staleTime: 60_000 });
  const { data: site } = useQuery({ queryKey: ["site-data"], queryFn: () => siteFn(), staleTime: 60_000 });
  const [q, setQ] = useState("");

  const settingsI18n: any = pickI18n(site?.settingsI18n as any, lang) ?? {};
  const title = settingsI18n.faq_title || (ar ? "الأسئلة الشائعة" : "Frequently Asked Questions");
  const description = settingsI18n.faq_description
    || (ar ? "إجابات سريعة على أكثر الأسئلة التي تصلنا." : "Quick answers to the questions we hear most often.");

  const rows = useMemo(() => {
    const list = (data?.faqs ?? []).map((f: any) => {
      const i = pickI18n((data!.faqsI18n as any[]).filter((x: any) => x.faq_id === f.id), lang);
      return { id: f.id, question: i?.question ?? "", answer: i?.answer ?? "" };
    }).filter((r) => r.question);
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) => (r.question + " " + r.answer).toLowerCase().includes(term));
  }, [data, lang, q]);

  const faqJsonLd = useMemo(() => JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: rows.map((r) => ({
      "@type": "Question",
      name: r.question,
      acceptedAnswer: { "@type": "Answer", text: r.answer },
    })),
  }), [rows]);

  return (
    <>
      <section className="border-b border-border/60 bg-muted/30">
        <div className="container-narrow py-14 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs">
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            {ar ? "مركز المساعدة" : "Help center"}
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold">{title}</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">{description}</p>
          <div className="relative mt-6 max-w-md">
            <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={ar ? "ابحث في الأسئلة..." : "Search questions..."}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </section>

      <div className="container-narrow py-12 grid lg:grid-cols-[1fr_320px] gap-10 items-start">
        <div>
          {rows.length === 0 ? (
            <p className="text-muted-foreground">{ar ? "لا توجد نتائج مطابقة." : "No matching questions."}</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {rows.map((r) => (
                <AccordionItem key={r.id} value={r.id}>
                  <AccordionTrigger className="text-start text-base font-medium">{r.question}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line leading-relaxed text-muted-foreground">
                    {r.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        <aside className="rounded-2xl border border-border/60 bg-card p-6">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h2 className="mt-3 font-semibold">{ar ? "لم تجد إجابتك؟" : "Still have a question?"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {ar ? "فريقنا جاهز للإجابة على استفساراتك." : "Our team is happy to help you directly."}
          </p>
          <Button asChild className="mt-4 w-full"><Link to="/contact">{ar ? "تواصل معنا" : "Contact us"}</Link></Button>
          <Button asChild variant="outline" className="mt-2 w-full"><Link to="/donate">{ar ? "تبرع الآن" : "Donate now"}</Link></Button>
        </aside>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqJsonLd }} />
    </>
  );
}
