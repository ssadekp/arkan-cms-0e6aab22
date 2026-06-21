import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminGetForm, saveField, deleteField } from "@/lib/forms.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, ArrowLeft, Inbox } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/forms/$id/")({
  component: FormFieldsPage,
});

const TYPES = [
  { value: "text", label: "Short text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Select (dropdown)" },
  { value: "radio", label: "Radio buttons" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "file", label: "File upload" },
];

const NEEDS_OPTIONS = new Set(["select", "radio", "checkbox"]);

function FormFieldsPage() {
  const { id } = Route.useParams();
  const get = useServerFn(adminGetForm);
  const del = useServerFn(deleteField);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-form", id], queryFn: () => get({ data: { id } }) });
  const form: any = data?.form;
  const fields = ((data?.fields ?? []) as any[]).sort((a, b) => a.position - b.position);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-form", id] });

  const onDelete = async (fid: string) => {
    if (!confirm("Delete this field?")) return;
    await del({ data: { id: fid } });
    toast.success("Deleted");
    invalidate();
  };

  return (
    <AdminShell title={form ? `Form: ${form.title_en || form.slug}` : "Form"}>
      <div className="max-w-3xl space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/forms"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-1" />All forms</Button></Link>
          <Link to="/admin/forms/$id/submissions" params={{ id }}><Button variant="outline" size="sm"><Inbox className="h-4 w-4 me-1" />Submissions</Button></Link>
          <div className="ms-auto"><FieldDialog formId={id} nextPosition={fields.length} onSaved={invalidate} /></div>
        </div>

        {fields.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
            No fields yet. Add fields to define what users will fill in.
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((f) => (
              <div key={f.id} className="rounded-xl border border-border/60 bg-card p-3 flex items-center gap-3">
                <div className="text-xs font-mono bg-muted/40 rounded px-2 py-1">{f.field_type}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {f.label_en || f.label_ar || f.field_key}
                    {f.required && <span className="ms-1 text-destructive">*</span>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">key: {f.field_key}</div>
                </div>
                <FieldDialog formId={id} field={f} nextPosition={f.position} onSaved={invalidate} trigger={
                  <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4" /></Button>
                } />
                <Button variant="ghost" size="sm" onClick={() => onDelete(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function FieldDialog({ formId, field, nextPosition, onSaved, trigger }: {
  formId: string; field?: any; nextPosition: number; onSaved: () => void; trigger?: React.ReactNode;
}) {
  const save = useServerFn(saveField);
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<any>(() => field ?? blank(formId, nextPosition));

  const mut = useMutation({
    mutationFn: async () => save({ data: { ...v, id: field?.id ?? null, form_id: formId, options_json: NEEDS_OPTIONS.has(v.field_type) ? v.options_json : [] } }),
    onSuccess: () => { toast.success("Saved"); setOpen(false); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  const addOption = () => setV({ ...v, options_json: [...v.options_json, { value: "", label_en: "", label_ar: "" }] });
  const updateOption = (i: number, patch: any) => setV({ ...v, options_json: v.options_json.map((o: any, idx: number) => idx === i ? { ...o, ...patch } : o) });
  const removeOption = (i: number) => setV({ ...v, options_json: v.options_json.filter((_: any, idx: number) => idx !== i) });

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o && !field) setV(blank(formId, nextPosition)); }}>
      <DialogTrigger asChild>{trigger ?? <Button><Plus className="h-4 w-4 me-1" />Add field</Button>}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{field ? "Edit field" : "New field"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Type">
              <Select value={v.field_type} onValueChange={(t) => setV({ ...v, field_type: t })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </Labeled>
            <Labeled label="Key (used in exports)">
              <Input value={v.field_key} onChange={(e) => setV({ ...v, field_key: e.target.value })} placeholder="full_name" />
            </Labeled>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Label (English)"><Input value={v.label_en} onChange={(e) => setV({ ...v, label_en: e.target.value })} /></Labeled>
            <Labeled label="Label (العربية)"><Input value={v.label_ar} onChange={(e) => setV({ ...v, label_ar: e.target.value })} dir="rtl" /></Labeled>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Placeholder (English)"><Input value={v.placeholder_en} onChange={(e) => setV({ ...v, placeholder_en: e.target.value })} /></Labeled>
            <Labeled label="Placeholder (العربية)"><Input value={v.placeholder_ar} onChange={(e) => setV({ ...v, placeholder_ar: e.target.value })} dir="rtl" /></Labeled>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Field width">
              <Select value={v.width ?? "full"} onValueChange={(w) => setV({ ...v, width: w })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full width</SelectItem>
                  <SelectItem value="half">Half width</SelectItem>
                  <SelectItem value="third">Third width</SelectItem>
                </SelectContent>
              </Select>
            </Labeled>
            <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
              <Label>Required</Label>
              <Switch checked={v.required} onCheckedChange={(c) => setV({ ...v, required: c })} />
            </div>
          </div>

          {NEEDS_OPTIONS.has(v.field_type) && (
            <div className="space-y-2 rounded-md border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <Button type="button" size="sm" variant="outline" onClick={addOption}><Plus className="h-4 w-4" /></Button>
              </div>
              {v.options_json.length === 0 && <p className="text-xs text-muted-foreground">No options yet.</p>}
              {v.options_json.map((o: any, i: number) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <Input placeholder="value" value={o.value} onChange={(e) => updateOption(i, { value: e.target.value })} />
                  <Input placeholder="English label" value={o.label_en} onChange={(e) => updateOption(i, { label_en: e.target.value })} />
                  <Input placeholder="Arabic label" value={o.label_ar} onChange={(e) => updateOption(i, { label_ar: e.target.value })} dir="rtl" />
                  <Button variant="ghost" size="sm" onClick={() => removeOption(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}

          <Labeled label="Position">
            <Input type="number" value={v.position} onChange={(e) => setV({ ...v, position: Number(e.target.value) || 0 })} />
          </Labeled>
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
function blank(formId: string, position: number) {
  return {
    form_id: formId, position, field_key: "", field_type: "text",
    label_en: "", label_ar: "", placeholder_en: "", placeholder_ar: "",
    required: false, width: "full", options_json: [],
  };
}
