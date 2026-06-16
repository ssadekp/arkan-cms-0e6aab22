import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

type Category = "regulation" | "form" | "achievement";

const LABELS: Record<Category, { ar: string; en: string }> = {
  regulation: { ar: "اللوائح والأنظمة", en: "Regulations" },
  form: { ar: "النماذج والاستمارات", en: "Forms" },
  achievement: { ar: "تقارير الإنجازات", en: "Achievements" },
};

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "الوثائق والتقارير — Documents" },
      { name: "description", content: "Charity organization documents, regulations, forms, and achievement reports." },
    ],
  }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

function Body() {
  const { lang } = useI18n();
  const [tab, setTab] = useState<"all" | Category>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["public-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const filtered = (data ?? []).filter((d) => tab === "all" || d.category === tab);

  const title = lang === "ar" ? "الوثائق والتقارير" : "Documents";
  const subtitle =
    lang === "ar"
      ? "تصفح اللوائح والنماذج وتقارير إنجازاتنا"
      : "Browse our regulations, forms, and achievement reports";

  const tabs: { value: "all" | Category; label: string }[] = [
    { value: "all", label: lang === "ar" ? "الكل" : "All" },
    { value: "regulation", label: LABELS.regulation[lang] },
    { value: "form", label: LABELS.form[lang] },
    { value: "achievement", label: LABELS.achievement[lang] },
  ];

  return (
    <div className="container-narrow py-12 md:py-16">
      <header className="text-center mb-8 md:mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-muted-foreground">{subtitle}</p>
      </header>

      <div className="flex justify-center mb-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="flex-wrap h-auto">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="text-sm">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          {lang === "ar" ? "لا توجد وثائق متاحة" : "No documents available"}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((doc) => (
            <a
              key={doc.id}
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-border/60 bg-card hover:border-primary/60 hover:shadow-md transition-all p-6 flex flex-col"
            >
              <div className="flex items-center justify-center h-24 mb-4 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                <FileText className="h-12 w-12 text-primary" strokeWidth={1.5} />
              </div>
              <Badge variant="secondary" className="self-start mb-2">
                {LABELS[doc.category as Category][lang]}
              </Badge>
              <h3 className="font-semibold leading-snug flex-1">{doc.title}</h3>
              <Button variant="ghost" size="sm" className="mt-4 self-start gap-1.5" tabIndex={-1}>
                {lang === "ar" ? "عرض الملف" : "View file"}
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
