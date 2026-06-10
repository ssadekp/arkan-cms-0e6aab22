import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAll, saveTag, deleteTag } from "@/lib/admin.functions";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/tags")({
  component: TagsPage,
});

function TagsPage() {
  const fn = useServerFn(adminListAll);
  const save = useServerFn(saveTag);
  const del = useServerFn(deleteTag);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn() });
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ slug: "", name_ar: "", name_en: "" });

  const tags = data?.tags ?? [];
  const tagsI18n = data?.tagsI18n ?? [];

  const nameOf = (id: string, lang: "ar" | "en") =>
    (tagsI18n as any[]).find((x) => x.tag_id === id && x.lang === lang)?.name ?? "";

  const openNew = () => { setEditing({ __new: true }); setForm({ slug: "", name_ar: "", name_en: "" }); };
  const openEdit = (row: any) => {
    setEditing(row);
    setForm({ slug: row.slug, name_ar: nameOf(row.id, "ar"), name_en: nameOf(row.id, "en") });
  };

  const saveMut = useMutation({
    mutationFn: () => save({ data: { id: editing?.__new ? null : editing.id, ...form } }),
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-all"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-all"] }); },
  });

  return (
    <AdminShell title="Tags">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Tags</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 me-2" /> New tag</Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/60">
        {tags.length === 0 && <div className="p-6 text-sm text-muted-foreground">No tags yet.</div>}
        {tags.map((t: any) => (
          <div key={t.id} className="flex items-center justify-between p-4 gap-4">
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{nameOf(t.id, "ar")} / {nameOf(t.id, "en")}</div>
              <div className="text-xs text-muted-foreground">#{t.slug}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="outline" onClick={() => confirm("Delete?") && delMut.mutate(t.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.__new ? "New tag" : "Edit tag"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="health" />
            </div>
            <div className="space-y-1.5">
              <Label>Name (العربية)</Label>
              <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Name (English)</Label>
              <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
