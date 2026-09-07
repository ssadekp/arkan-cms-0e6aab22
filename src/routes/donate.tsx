import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useI18n, pickI18n } from "@/lib/i18n";
import { getSiteData } from "@/lib/content.functions";
import { submitDonation } from "@/lib/support.functions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { HeartHandshake, CheckCircle2, ShieldCheck, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/donate")({
  head: () => ({
    meta: [
      { title: "Donate Now — Lam7et Khair Foundation" },
      { name: "description", content: "Support our education, health and community programs with a donation. Share your details and our team will contact you." },
      { property: "og:title", content: "Donate Now — Lam7et Khair Foundation" },
      { property: "og:description", content: "Support our education, health and community programs with a donation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <SiteLayout><Body /></SiteLayout>,
});

const schema = z.object({
  name: z.string().trim().min(2, "required").max(100),
  phone: z.string().trim().min(6, "required").max(30).regex(/^[0-9+\-()\s]+$/, "invalid"),
  email: z.string().trim().email("invalid").max(255).optional().or(z.literal("")),
  amount: z.number().positive("invalid").max(10_000_000),
  note: z.string().trim().max(1000).optional(),
});

function Body() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const siteFn = useServerFn(getSiteData);
  const send = useServerFn(submitDonation);
  const { data } = useQuery({ queryKey: ["site-data"], queryFn: () => siteFn(), staleTime: 60_000 });
  const startedAt = useRef(Date.now());

  const settings: any = data?.settings ?? {};
  const i18n: any = pickI18n(data?.settingsI18n as any, lang) ?? {};
  const currency: string = settings.donation_currency || "EGP";
  const presets: number[] = useMemo(() => {
    const raw = settings.donation_amounts;
    return Array.isArray(raw) ? raw.map(Number).filter((n) => n > 0) : [100, 250, 500, 1000];
  }, [settings.donation_amounts]);

  const [form, setForm] = useState({ name: "", phone: "", email: "", amount: "", note: "", hp: "" });
  const [done, setDone] = useState(false);

  const mut = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        name: form.name,
        phone: form.phone,
        email: form.email,
        amount: Number(form.amount),
        note: form.note || undefined,
      });
      if (!parsed.success) {
        throw new Error(ar ? "يرجى مراجعة البيانات المدخلة" : "Please check the details you entered");
      }
      return send({ data: {
        ...parsed.data,
        hp: form.hp,
        started_at: startedAt.current,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : undefined,
      } });
    },
    onSuccess: () => setDone(true),
    onError: (e: any) => toast.error(e.message),
  });

  const title = i18n.donate_title || (ar ? "تبرع الآن" : "Donate Now");
  const description = i18n.donate_description
    || (ar ? "تبرعك يصنع فرقًا حقيقيًا في حياة الأسر التي نخدمها." : "Your gift makes a real difference for the families we serve.");

  if (settings.donation_enabled === false) {
    return (
      <div className="container-narrow py-24 text-center">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="mt-3 text-muted-foreground">
          {ar ? "التبرعات غير متاحة حاليًا. تواصل معنا لمعرفة المزيد." : "Donations are currently unavailable. Please contact us to learn more."}
        </p>
        <Button asChild className="mt-6"><Link to="/contact">{ar ? "تواصل معنا" : "Contact us"}</Link></Button>
      </div>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 bg-foreground text-background">
        <div className="container-narrow py-16 md:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-background/25 px-3 py-1 text-xs">
            <HeartHandshake className="h-3.5 w-3.5 text-primary" />
            {ar ? "شارك في الخير" : "Be part of the change"}
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold">{title}</h1>
          <p className="mt-3 max-w-2xl text-background/75 leading-relaxed">{description}</p>
        </div>
      </section>

      <div className="container-narrow py-14 grid lg:grid-cols-[1.15fr_.85fr] gap-10 items-start">
        <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8">
          {done ? (
            <div className="text-center py-10">
              <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 text-xl font-semibold">
                {i18n.donate_thanks || (ar ? "شكرًا لك! سيتواصل فريقنا معك لإتمام التبرع." : "Thank you! Our team will contact you to complete your donation.")}
              </h2>
              <Button variant="outline" className="mt-6" onClick={() => { setDone(false); setForm({ name: "", phone: "", email: "", amount: "", note: "", hp: "" }); startedAt.current = Date.now(); }}>
                {ar ? "تبرع مرة أخرى" : "Make another donation"}
              </Button>
            </div>
          ) : (
            <form
              className="space-y-5"
              onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
            >
              <div className="space-y-2">
                <Label>{ar ? "مبلغ التبرع" : "Donation amount"} ({currency})</Label>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, amount: String(p) })}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        Number(form.amount) === p
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70 hover:border-primary/60"
                      }`}
                    >
                      {p.toLocaleString(ar ? "ar-EG" : "en-US")}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  placeholder={ar ? "أو أدخل مبلغًا آخر" : "Or enter another amount"}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>{ar ? "الاسم" : "Full name"} *</Label>
                  <Input value={form.name} maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label>{ar ? "رقم الهاتف" : "Phone number"} *</Label>
                  <Input value={form.phone} maxLength={30} inputMode="tel" onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{ar ? "البريد الإلكتروني" : "Email"}</Label>
                <Input type="email" value={form.email} maxLength={255} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label>{ar ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
                <Textarea rows={3} maxLength={1000} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder={ar ? "هل ترغب في تخصيص تبرعك لمشروع معين؟" : "Would you like to direct your gift to a specific project?"} />
              </div>

              {/* honeypot */}
              <input
                type="text" tabIndex={-1} autoComplete="off" value={form.hp}
                onChange={(e) => setForm({ ...form, hp: e.target.value })}
                className="hidden" aria-hidden="true"
              />

              <Button type="submit" size="lg" className="w-full" disabled={mut.isPending}>
                {mut.isPending ? (ar ? "جارٍ الإرسال..." : "Sending...") : (ar ? "أتبرع الآن" : "Donate now")}
              </Button>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                {ar ? "بياناتك محفوظة بسرية ولن تُستخدم إلا للتواصل بشأن تبرعك." : "Your details stay private and are only used to follow up on your donation."}
              </p>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          {i18n.donate_payment_info && (
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-6">
              <h3 className="font-semibold">{ar ? "طرق الدفع" : "Payment details"}</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground leading-relaxed">
                {i18n.donate_payment_info}
              </p>
            </div>
          )}
          <div className="rounded-2xl border border-border/60 p-6 space-y-3">
            <h3 className="font-semibold">{ar ? "تحتاج مساعدة؟" : "Need help?"}</h3>
            {settings.contact_phone && (
              <a href={`tel:${settings.contact_phone}`} className="flex items-center gap-2 text-sm hover:text-primary" dir="ltr">
                <Phone className="h-4 w-4 text-primary" />{settings.contact_phone}
              </a>
            )}
            {settings.contact_email && (
              <a href={`mailto:${settings.contact_email}`} className="flex items-center gap-2 text-sm hover:text-primary">
                <Mail className="h-4 w-4 text-primary" />{settings.contact_email}
              </a>
            )}
            <Link to="/faq" className="block text-sm text-primary hover:underline">
              {ar ? "الأسئلة الشائعة عن التبرع" : "Donation FAQ"}
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
