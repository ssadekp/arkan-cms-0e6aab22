import { useEffect, useRef, useState } from "react";
import { Sparkles, Square, Upload, X, Copy, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { canUseHeroAdvice, MAX_REFERENCE_BYTES } from "@/lib/hero-ai/input";
import { toast } from "sonner";

export function HeroLayoutAdviser() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [allowed, setAllowed] = useState(false);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<{ data: string; name: string }>();
  const [result, setResult] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(false);
  const [restoreAccess, setRestoreAccess] = useState(false);
  const [stopped, setStopped] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const roles = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      if (active) setAllowed(canUseHeroAdvice((roles.data ?? []).map((row) => row.role)));
    })();
    return () => { active = false; abort.current?.abort(); };
  }, []);

  async function attach(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > MAX_REFERENCE_BYTES || !file.size) {
      setError(ar ? "اختر صورة PNG أو JPEG أو WebP بحجم لا يتجاوز 5 ميجابايت." : "Choose a PNG, JPEG or WebP image up to 5 MB.");
      return;
    }
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Invalid image"));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      setImage({ data, name: file.name }); setError("");
    } catch { setError(ar ? "تعذر قراءة الصورة." : "Could not read the image."); }
  }

  async function generate() {
    if (busy) return;
    setBusy(true); setError(""); setResult(""); setReasoning(""); setStopped(false);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error(ar ? "يرجى تسجيل الدخول مجدداً." : "Please sign in again.");
      const response = await fetch("/api/hero-advice", {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ description, image: image?.data, lang, restoreAccess }),
      });
      if (!response.ok) {
        const body = await response.json();
        setDenied(response.status === 403);
        throw new Error(body.message || "Recommendation unavailable.");
      }
      if (!response.body) throw new Error("No response received.");
      setDenied(false); setRestoreAccess(false);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let doneEvent = false;
      const consume = (line: string) => {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === "text") setResult((value) => value + event.text);
        if (event.type === "reasoning") setReasoning((value) => value + event.text);
        if (event.type === "done") doneEvent = true;
        if (event.type === "error") { setDenied(event.status === 403); throw new Error(event.message); }
      };
      try {
        while (true) {
          const chunk = await reader.read();
          buffer += decoder.decode(chunk.value, { stream: !chunk.done });
          const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
          lines.forEach(consume);
          if (chunk.done) { consume(buffer); break; }
        }
        if (!doneEvent) throw new Error(ar ? "انقطع الرد؛ يمكنك بدء طلب جديد." : "The response was interrupted; start a new request when ready.");
      } finally { await reader.cancel().catch(() => {}); }
    } catch (e) {
      if (controller.signal.aborted) setStopped(true);
      else setError(e instanceof Error ? e.message : "Recommendation unavailable.");
    } finally { setBusy(false); abort.current = null; }
  }

  if (!allowed) return null;
  return (
    <section aria-labelledby="hero-adviser-title" className="border-t border-border pt-6 space-y-4">
      <h3 id="hero-adviser-title" className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-5 text-primary" />{ar ? "مستشار البانر بالذكاء الاصطناعي" : "AI banner adviser"}</h3>
      <div className="space-y-2">
        <Label htmlFor="hero-advice-brief">{ar ? "وصف التصميم المطلوب" : "Layout brief"}</Label>
        <Textarea id="hero-advice-brief" rows={4} maxLength={4000} value={description} disabled={busy} onChange={(e) => setDescription(e.target.value)} placeholder={ar ? "بانر بصورة واسعة، عنوان بمحاذاة اليمين وزر للتبرع…" : "Full-width photograph, side-aligned headline and a donation button…"} />
        <span className="text-xs text-muted-foreground">{description.length}/4000</span>
      </div>
      <input ref={fileInput} type="file" className="hidden" aria-label={ar ? "صورة مرجعية" : "Reference image"} accept="image/png,image/jpeg,image/webp" onChange={(e) => { void attach(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}><Upload className="size-4" />{ar ? "إرفاق صورة مرجعية" : "Attach reference image"}</Button>
        <span className="text-xs text-muted-foreground">PNG · JPEG · WebP · 5 MB</span>
      </div>
      {image && <div className="flex items-center gap-3 min-w-0">
        <img src={image.data} alt={ar ? "الصورة المرجعية" : "Reference image preview"} className="h-24 w-36 rounded-md object-contain bg-muted" />
        <span className="text-sm truncate flex-1">{image.name}</span>
        <Button size="icon" variant="ghost" disabled={busy} title={ar ? "حذف الصورة" : "Remove reference image"} aria-label={ar ? "حذف الصورة" : "Remove reference image"} onClick={() => setImage(undefined)}><X className="size-4" /></Button>
      </div>}
      <p className="text-xs text-muted-foreground">{ar ? "يتم إرسال الوصف والصورة والهوية المحفوظة إلى Lovable AI. التوصية لا تغير الموقع. يُحتسب الاستخدام من رصيد الذكاء الاصطناعي." : "Your brief, reference and saved branding are sent to Lovable AI. Recommendations do not change your site. AI credit usage applies."}</p>
      {denied && <div className="flex items-start gap-2"><Checkbox id="hero-ai-restore" checked={restoreAccess} onCheckedChange={(value) => setRestoreAccess(value === true)} /><Label htmlFor="hero-ai-restore">{ar ? "تمت استعادة صلاحية خدمة الذكاء الاصطناعي؛ بدء طلب جديد" : "AI service access has been restored; start a fresh request"}</Label></div>}
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || (!description.trim() && !image) || (denied && !restoreAccess)} onClick={() => void generate()}><Sparkles className="size-4" />{ar ? "اقتراح تصميم" : "Recommend layout"}</Button>
        {busy && <Button variant="outline" onClick={() => abort.current?.abort()}><Square className="size-4" />{ar ? "إيقاف" : "Stop"}</Button>}
      </div>
      {busy && <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin motion-reduce:animate-none" />{ar ? "جار إعداد التوصية…" : "Preparing recommendation…"}</div>}
      {error && <p role="alert" className="text-sm text-destructive break-words">{error}</p>}
      {stopped && <p role="status" className="text-sm text-muted-foreground">{ar ? "تم إيقاف الطلب" : "Request stopped"}</p>}
      {reasoning && <details className="text-sm text-muted-foreground"><summary>{ar ? "ملاحظات التصميم" : "Design notes"}</summary><p className="whitespace-pre-wrap break-words pt-2">{reasoning}</p></details>}
      {result && <div className="space-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{ar ? "التصميم المقترح" : "Recommended layout"}</h4><div className="flex gap-1">
          <Button variant="ghost" size="icon" disabled={busy} title={ar ? "نسخ" : "Copy recommendation"} aria-label={ar ? "نسخ" : "Copy recommendation"} onClick={() => { void navigator.clipboard.writeText(result).then(() => toast.success(ar ? "تم النسخ" : "Copied"), () => toast.error(ar ? "تعذر النسخ" : "Could not copy")); }}><Copy className="size-4" /></Button>
          <Button variant="ghost" size="icon" disabled={busy} title={ar ? "تنزيل" : "Download recommendation"} aria-label={ar ? "تنزيل" : "Download recommendation"} onClick={() => { const url = URL.createObjectURL(new Blob([result], { type: "text/plain;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "hero-layout-recommendation.txt"; a.click(); URL.revokeObjectURL(url); }}><Download className="size-4" /></Button>
        </div></div>
        <div aria-live="polite" className="whitespace-pre-wrap break-words text-sm leading-7">{result}</div>
      </div>}
    </section>
  );
}