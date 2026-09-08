import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListFaqs, saveFaq, deleteFaq, reorderFaqs } from "@/lib/support.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/faq")({
  component: FaqAdmin,
});

type Draft = {
  id: string | null;
  sort_order: number;
  published: boolean;
  ar: { question: string; answer: string };
  en: { question: string; answer: string };
};

const emptyDraft = (sort_order: number): Draft => ({
  id: null, sort_order, published: true,
  ar: { question: "", answer: "" },
  en: { question: "", answer: "" },
});

function FaqAdmin() {
  const list = useServerFn(adminListFaqs);
  const save = useServerFn(saveFaq);
  const del = useServerFn(deleteFaq);
  const reorder = useServerFn(reorderFaqs);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-faqs"], queryFn: () => list() });
  const [draft, setDraft] = useState<Draft | null>(null);

  const faqs = ((data?.faqs as any[]) ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
  const i18nRows = (data?.faqsI18n as any[]) ?? [];
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-faqs"] });
    qc.invalidateQueries({ queryKey: ["faqs"] });
  };

  const saveMut = useMutation({
    mutationFn: async (d: Draft) => save({ data: {
      id: d.id, sort_order: d.sort_order, published: d.published,
      i18n: [{ lang: "ar", ...d.ar }, { lang: "en", ...d.en }],
    } }),
    onSuccess: () => { toast.success("Saved"); setDraft(null); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const open = (f?: any) => {
    if (!f) return setDraft(emptyDraft((faqs.at(-1)?.sort_order ?? 0) + 1));
    const ar = i18nRows.find((x) => x.faq_id === f.id && x.lang === "ar") ?? {};
    const en = i18nRows.find((x) => x.faq_id === f.id && x.lang === "en") ?? {};
    setDraft({
      id: f.id, sort_order: f.sort_order, published: f.published,
      ar: { question: ar.question ?? "", answer: ar.answer ?? "" },
      en: { question: en.question ?? "", answer: en.answer ?? "" },
    });
  };

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...faqs];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    await reorder({ data: { items: next.map((f, i) => ({ id: f.id, sort_order: i + 1 })) } });
    invalidate();
  };

  return (
    <AdminShell title="FAQ">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Questions shown on the public <span className="font-medium">/faq</span> page, in Arabic and English.
          </p>
          <Button onClick={() => open()}><Plus className="h-4 w-4 me-1" /> Add question</Button>
        </div>

        <div className="space-y-2">
          {faqs.map((f, i) => {
            const ar = i18nRows.find((x) => x.faq_id === f.id && x.lang === "ar");
            const en = i18nRows.find((x) => x.faq_id === f.id && x.lang === "en");
            return (
              <div key={f.id} className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
                <div className="flex flex-col">
                  <button className="p-0.5 text-muted-foreground hover:text-foreground" onClick={() => move(i, -1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button className="p-0.5 text-muted-foreground hover:text-foreground" onClick={() => move(i, 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{ar?.question || en?.question || "—"}</div>
                  <div className="truncate text-xs text-muted-foreground">{en?.question}</div>
                </div>
                {!f.published && <span className="rounded bg-muted px-2 py-0.5 text-xs">Hidden</span>}
                <Button variant="ghost" size="icon" onClick={() => open(f)} aria-label="Edit"><Edit2 className="h-4 w-4" /></Button>
                <Button
                  variant="ghost" size="icon" aria-label="Delete"
                  onClick={async () => {
                    if (!confirm("Delete this question?")) return;
                    await del({ data: { id: f.id } });
                    invalidate();
                  }}
                ><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            );
          })}
          {faqs.length === 0 && <p className="text-sm text-muted-foreground">No questions yet.</p>}
        </div>
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{draft?.id ? "Edit question" : "New question"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-4">
              <Tabs defaultValue="ar">
                <TabsList>
                  <TabsTrigger value="ar">العربية</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
                {(["ar", "en"] as const).map((l) => (
                  <TabsContent key={l} value={l} className="space-y-3 pt-3">
                    <div className="space-y-1.5">
                      <Label>Question</Label>
                      <Input
                        value={draft[l].question}
                        maxLength={300}
                        onChange={(e) => setDraft({ ...draft, [l]: { ...draft[l], question: e.target.value } })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Answer</Label>
                      <Textarea
                        rows={6}
                        maxLength={5000}
                        value={draft[l].answer}
                        onChange={(e) => setDraft({ ...draft, [l]: { ...draft[l], answer: e.target.value } })}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
              <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                <Label className="text-sm font-normal">Published</Label>
                <Switch checked={draft.published} onCheckedChange={(v) => setDraft({ ...draft, published: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraft(null)}>Cancel</Button>
            <Button onClick={() => draft && saveMut.mutate(draft)} disabled={saveMut.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
