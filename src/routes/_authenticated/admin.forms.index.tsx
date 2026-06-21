import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListForms, saveForm, deleteForm } from "@/lib/forms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, Eye, Inbox, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/forms/")({
  component: FormsPage,
});

function FormsPage() {
  const list = useServerFn(adminListForms);
  const del = useServerFn(deleteForm);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-forms"], queryFn: () => list() });
  const forms = (data?.forms ?? []) as any[];

  const onDelete = async (id: string) => {
    if (!confirm("Delete this form and ALL its submissions?")) return;
    await del({ data: { id } });
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-forms"] });
  };

  return (
    <AdminShell title="Contact Forms">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Create custom contact forms. Each form gets a public URL and stores submissions you can export to Excel.</p>
          <FormDialog onSaved={() => qc.invalidateQueries({ queryKey: ["admin-forms"] })} />
        </div>

        {forms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            No forms yet. Click "Add form" to create one.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {forms.map((f) => (
              <div key={f.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{f.title_en || f.title_ar || f.slug}</div>
                    <div className="text-xs text-muted-foreground truncate">{f.title_ar}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <LinkIcon className="h-3 w-3" /> /forms/{f.slug}
                      {!f.published && <span className="ms-2 text-amber-600">· unpublished</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold">{f.submission_count}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">submissions</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to="/admin/forms/$id" params={{ id: f.id }}>
                    <Button variant="outline" size="sm"><Edit2 className="h-4 w-4 me-1" />Fields</Button>
                  </Link>
                  <Link to="/admin/forms/$id/submissions" params={{ id: f.id }}>
                    <Button variant="outline" size="sm"><Inbox className="h-4 w-4 me-1" />Submissions</Button>
                  </Link>
                  <a href={`/forms/${f.slug}`} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm"><Eye className="h-4 w-4 me-1" />View</Button>
                  </a>
                  <FormDialog form={f} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-forms"] })} trigger={
                    <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4" /></Button>
                  } />
                  <Button variant="ghost" size="sm" onClick={() => onDelete(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function FormDialog({ form, onSaved, trigger }: { form?: any; onSaved: () => void; trigger?: React.ReactNode }) {
  const save = useServerFn(saveForm);
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<any>(() => form ?? blank());

  const mut = useMutation({
    mutationFn: async () => save({ data: { ...v, id: form?.id ?? null, notify_email: v.notify_email || null } }),
    onSuccess: () => { toast.success("Saved"); setOpen(false); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && !form) setV(blank()); }}>
      <DialogTrigger asChild>{trigger ?? <Button><Plus className="h-4 w-4 me-1" />Add form</Button>}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{form ? "Edit form" : "New form"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Labeled label="Slug (URL: /forms/<slug>)">
            <Input value={v.slug} onChange={(e) => setV({ ...v, slug: e.target.value })} placeholder="general-inquiry" />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Title (English)"><Input value={v.title_en} onChange={(e) => setV({ ...v, title_en: e.target.value })} /></Labeled>
            <Labeled label="Title (العربية)"><Input value={v.title_ar} onChange={(e) => setV({ ...v, title_ar: e.target.value })} dir="rtl" /></Labeled>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Description (English)"><Textarea rows={3} value={v.description_en} onChange={(e) => setV({ ...v, description_en: e.target.value })} /></Labeled>
            <Labeled label="Description (العربية)"><Textarea rows={3} value={v.description_ar} onChange={(e) => setV({ ...v, description_ar: e.target.value })} dir="rtl" /></Labeled>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Success message (English)"><Input value={v.success_message_en} onChange={(e) => setV({ ...v, success_message_en: e.target.value })} /></Labeled>
            <Labeled label="Success message (العربية)"><Input value={v.success_message_ar} onChange={(e) => setV({ ...v, success_message_ar: e.target.value })} dir="rtl" /></Labeled>
          </div>
          <Labeled label="Notify email (optional)"><Input type="email" value={v.notify_email ?? ""} onChange={(e) => setV({ ...v, notify_email: e.target.value })} /></Labeled>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
            <Label>Published</Label>
            <Switch checked={v.published} onCheckedChange={(c) => setV({ ...v, published: c })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
function blank() {
  return {
    slug: "", title_en: "", title_ar: "", description_en: "", description_ar: "",
    success_message_en: "Thank you for your submission.", success_message_ar: "شكراً لتواصلكم معنا.",
    notify_email: "", published: true,
  };
}
