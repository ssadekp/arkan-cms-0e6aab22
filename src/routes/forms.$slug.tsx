import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getForm, submitForm } from "@/lib/forms.functions";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/forms/$slug")({
  component: PublicFormPage,
});

function PublicFormPage() {
  return <SiteLayout><PublicForm /></SiteLayout>;
}

function PublicForm() {
  const { slug } = Route.useParams();
  const { lang, dir } = useI18n();
  const fn = useServerFn(getForm);
  const submit = useServerFn(submitForm);
  const { data, isLoading } = useQuery({ queryKey: ["public-form", slug], queryFn: () => fn({ data: { slug } }) });

  const [values, setValues] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [done, setDone] = useState(false);
  const [hp, setHp] = useState(""); // honeypot
  const startedAtRef = useRef<number>(Date.now());

  const form: any = data?.form;
  const fields = ((data?.fields ?? []) as any[]).sort((a, b) => a.position - b.position);

  const mut = useMutation({
    mutationFn: async () => {
      // upload files first
      const uploaded: any[] = [];
      for (const f of fields) {
        if (f.field_type === "file") {
          const file = files[f.field_key];
          if (!file) continue;
          const path = `contact-uploads/${form.id}/${crypto.randomUUID()}-${file.name}`;
          const { error } = await supabase.storage.from("site-media").upload(path, file, { upsert: false });
          if (error) throw new Error(error.message);
          const { data: pub } = supabase.storage.from("site-media").getPublicUrl(path);
          uploaded.push({ field_key: f.field_key, path, name: file.name, url: pub.publicUrl });
        }
      }
      // required check
      for (const f of fields) {
        if (!f.required) continue;
        if (f.field_type === "file") {
          if (!files[f.field_key]) throw new Error(`${pickLabel(f, lang)} is required`);
        } else {
          const v = values[f.field_key];
          if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) {
            throw new Error(`${pickLabel(f, lang)} is required`);
          }
        }
      }
      await submit({ data: { form_id: form.id, data: values, files: uploaded, user_agent: navigator.userAgent.slice(0, 500), hp, started_at: startedAtRef.current } });
    },
    onSuccess: () => { setDone(true); setValues({}); setFiles({}); },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="container-narrow py-20 text-center text-muted-foreground">Loading…</div>;
  if (!data || !form) {
    throw notFound();
  }

  const title = (lang === "ar" ? form.title_ar : form.title_en) || form.title_en || form.title_ar || form.slug;
  const desc = (lang === "ar" ? form.description_ar : form.description_en) || "";
  const success = (lang === "ar" ? form.success_message_ar : form.success_message_en) || "Thank you.";

  return (
    <div className="container-narrow py-16 max-w-3xl" dir={dir}>
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
        {desc && <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{desc}</p>}
      </header>

      {done ? (
        <div className="rounded-2xl border border-border/60 bg-card p-10 text-center space-y-4 shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
          <p className="text-lg">{success}</p>
          <Button variant="outline" onClick={() => setDone(false)}>{lang === "ar" ? "إرسال آخر" : "Submit another"}</Button>
        </div>
      ) : (
        <form
          className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-sm"
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        >
          {/* Honeypot: hidden from humans, filled by bots */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
            <label>Leave this field empty
              <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-x-5 gap-y-5">
            {fields.map((f) => {
              const w = f.width ?? "full";
              const span = w === "third" ? "md:col-span-2" : w === "half" ? "md:col-span-3" : "md:col-span-6";
              return (
                <div key={f.id} className={span}>
                  <FieldRenderer field={f} lang={lang} value={values[f.field_key]}
                    onChange={(v: any) => setValues({ ...values, [f.field_key]: v })}
                    onFile={(file: File | null) => setFiles({ ...files, [f.field_key]: file })} />
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex items-center justify-end gap-3 border-t border-border/60 pt-6">
            <p className="text-xs text-muted-foreground me-auto">
              {lang === "ar" ? "الحقول المميزة بـ * مطلوبة" : "Fields marked with * are required"}
            </p>
            <Button type="submit" size="lg" disabled={mut.isPending} className="min-w-32">
              {mut.isPending ? (lang === "ar" ? "جار الإرسال…" : "Submitting…") : (lang === "ar" ? "إرسال" : "Submit")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function pickLabel(f: any, lang: string) {
  return (lang === "ar" ? f.label_ar : f.label_en) || f.label_en || f.label_ar || f.field_key;
}

function FieldRenderer({ field, lang, value, onChange, onFile }: any) {
  const label = pickLabel(field, lang);
  const placeholder = (lang === "ar" ? field.placeholder_ar : field.placeholder_en) || "";
  const options: any[] = field.options_json ?? [];
  const optLabel = (o: any) => (lang === "ar" ? o.label_ar : o.label_en) || o.value;

  const head = (
    <Label className="flex items-center gap-1">
      {label}{field.required && <span className="text-destructive">*</span>}
    </Label>
  );

  switch (field.field_type) {
    case "textarea":
      return <div className="space-y-1.5">{head}<Textarea rows={5} placeholder={placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>;
    case "select":
      return (
        <div className="space-y-1.5">{head}
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
            <option value="">—</option>
            {options.map((o) => <option key={o.value} value={o.value}>{optLabel(o)}</option>)}
          </select>
        </div>
      );
    case "radio":
      return (
        <div className="space-y-1.5">{head}
          <div className="space-y-1">
            {options.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <input type="radio" name={field.field_key} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
                {optLabel(o)}
              </label>
            ))}
          </div>
        </div>
      );
    case "checkbox": {
      const arr: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-1.5">{head}
          <div className="space-y-1">
            {options.map((o) => {
              const checked = arr.includes(o.value);
              return (
                <label key={o.value} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={checked} onChange={(e) => {
                    const next = e.target.checked ? [...arr, o.value] : arr.filter((x) => x !== o.value);
                    onChange(next);
                  }} />
                  {optLabel(o)}
                </label>
              );
            })}
          </div>
        </div>
      );
    }
    case "file":
      return (
        <div className="space-y-1.5">{head}
          <Input type="file" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        </div>
      );
    case "date":
      return <div className="space-y-1.5">{head}<Input type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>;
    case "number":
      return <div className="space-y-1.5">{head}<Input type="number" placeholder={placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>;
    case "email":
      return <div className="space-y-1.5">{head}<Input type="email" placeholder={placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>;
    case "phone":
      return <div className="space-y-1.5">{head}<Input type="tel" placeholder={placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>;
    default:
      return <div className="space-y-1.5">{head}<Input placeholder={placeholder} value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></div>;
  }
}
