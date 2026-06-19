import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListMenu, saveMenuItem, deleteMenuItem, reorderMenuItems, getMenuPickerOptions } from "@/lib/menu.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, ArrowUp, ArrowDown, CornerDownRight } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: MenuPage,
});

const DEFAULTS: { label_en: string; label_ar: string; url: string }[] = [
  { label_en: "Home", label_ar: "الرئيسية", url: "/" },
  { label_en: "About", label_ar: "من نحن", url: "/about" },
  { label_en: "Focus Areas", label_ar: "مجالات العمل", url: "/focus-areas" },
  { label_en: "Projects", label_ar: "المشاريع", url: "/projects" },
  { label_en: "Partners", label_ar: "الشركاء", url: "/partners" },
  { label_en: "News", label_ar: "الأخبار", url: "/news" },
  { label_en: "Resources", label_ar: "المصادر", url: "/resources" },
  { label_en: "Contact", label_ar: "تواصل معنا", url: "/contact" },
];


type Item = {
  id: string;
  parent_id: string | null;
  position: number;
  label_en: string;
  label_ar: string;
  url: string;
  target: "_self" | "_blank";
  published: boolean;
};

function MenuPage() {
  const list = useServerFn(adminListMenu);
  const reorder = useServerFn(reorderMenuItems);
  const del = useServerFn(deleteMenuItem);
  const save = useServerFn(saveMenuItem);
  const pickerFn = useServerFn(getMenuPickerOptions);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-menu"], queryFn: () => list() });
  const { data: pickerData } = useQuery({ queryKey: ["admin-menu-picker"], queryFn: () => pickerFn() });

  const items: Item[] = (data?.items ?? []) as any;
  const parents = items.filter((i) => !i.parent_id).sort((a, b) => a.position - b.position);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin-menu"] });
    qc.invalidateQueries({ queryKey: ["site-data"] });
  };

  const move = async (group: Item[], idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= group.length) return;
    const a = group[idx], b = group[j];
    await reorder({ data: { items: [{ id: a.id, position: b.position }, { id: b.id, position: a.position }] } });
    invalidate();
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this menu item and all its sub-items?")) return;
    await del({ data: { id } });
    toast.success("Deleted");
    invalidate();
  };

  const quickAdd = async (preset: { label_en: string; label_ar: string; url: string }) => {
    const maxPos = parents.reduce((m, p) => Math.max(m, p.position), 0);
    await save({ data: {
      id: null, parent_id: null, position: maxPos + 1,
      label_en: preset.label_en, label_ar: preset.label_ar, url: preset.url,
      target: "_self", published: true,
    } as any });
    toast.success(`Added "${preset.label_en}"`);
    invalidate();
  };


  return (
    <AdminShell title="Main Menu">
      <div className="max-w-3xl space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Build the public site's main menu. Top-level items can have one level of sub-items. Leave empty to fall back to the default menu.
          </p>
          <ItemDialog onSaved={invalidate} parents={parents} />
        </div>

        {parents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
            No menu items yet. The site is using the default menu.
          </div>
        ) : (
          <div className="space-y-3">
            {parents.map((p, idx) => {
              const children = items.filter((c) => c.parent_id === p.id).sort((a, b) => a.position - b.position);
              return (
                <div key={p.id} className="rounded-xl border border-border/60 bg-card">
                  <ItemRow item={p} onMoveUp={() => move(parents, idx, -1)} onMoveDown={() => move(parents, idx, 1)}
                    onDelete={() => onDelete(p.id)} onSaved={invalidate} parents={parents} canAddChild />
                  {children.length > 0 && (
                    <div className="border-t border-border/60">
                      {children.map((c, cIdx) => (
                        <div key={c.id} className="border-b border-border/60 last:border-b-0 ps-8 flex items-center gap-2">
                          <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="flex-1">
                            <ItemRow item={c} onMoveUp={() => move(children, cIdx, -1)} onMoveDown={() => move(children, cIdx, 1)}
                              onDelete={() => onDelete(c.id)} onSaved={invalidate} parents={parents} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

function ItemRow({ item, onMoveUp, onMoveDown, onDelete, onSaved, parents, canAddChild }: {
  item: Item; onMoveUp: () => void; onMoveDown: () => void; onDelete: () => void;
  onSaved: () => void; parents: Item[]; canAddChild?: boolean;
}) {
  return (
    <div className="p-3 flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">
          {item.label_en || item.label_ar} <span className="text-xs text-muted-foreground">({item.label_ar || "—"})</span>
        </div>
        <div className="text-xs text-muted-foreground truncate">{item.url}{!item.published && " · hidden"}</div>
      </div>
      <Button variant="ghost" size="sm" onClick={onMoveUp}><ArrowUp className="h-4 w-4" /></Button>
      <Button variant="ghost" size="sm" onClick={onMoveDown}><ArrowDown className="h-4 w-4" /></Button>
      <ItemDialog item={item} onSaved={onSaved} parents={parents} trigger={
        <Button variant="ghost" size="sm"><Edit2 className="h-4 w-4" /></Button>
      } />
      {canAddChild && (
        <ItemDialog onSaved={onSaved} parents={parents} forcedParentId={item.id} trigger={
          <Button variant="ghost" size="sm" title="Add sub-item"><Plus className="h-4 w-4" /></Button>
        } />
      )}
      <Button variant="ghost" size="sm" onClick={onDelete}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
}

function ItemDialog({ item, onSaved, parents, trigger, forcedParentId }: {
  item?: Item; onSaved: () => void; parents: Item[]; trigger?: React.ReactNode; forcedParentId?: string;
}) {
  const save = useServerFn(saveMenuItem);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Item>(() => item ?? {
    id: "" as any, parent_id: forcedParentId ?? null, position: Date.now() % 100000,
    label_en: "", label_ar: "", url: "/", target: "_self", published: true,
  });

  const mut = useMutation({
    mutationFn: async () => save({ data: { ...form, id: item?.id ?? null } as any }),
    onSuccess: () => { toast.success("Saved"); setOpen(false); onSaved(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o && !item) setForm({ id: "" as any, parent_id: forcedParentId ?? null, position: Date.now() % 100000, label_en: "", label_ar: "", url: "/", target: "_self", published: true });
    }}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="h-4 w-4 me-1" />Add item</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{item ? "Edit menu item" : "Add menu item"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Label (English)"><Input value={form.label_en} onChange={(e) => setForm({ ...form, label_en: e.target.value })} /></Labeled>
            <Labeled label="Label (العربية)"><Input value={form.label_ar} onChange={(e) => setForm({ ...form, label_ar: e.target.value })} dir="rtl" /></Labeled>
          </div>
          <Labeled label="URL or path (e.g. /about or https://...)">
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="/about" />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Parent (top-level if none)">
              <Select value={form.parent_id ?? "__none__"} onValueChange={(v) => setForm({ ...form, parent_id: v === "__none__" ? null : v })} disabled={!!forcedParentId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Top level —</SelectItem>
                  {parents.filter((p) => p.id !== item?.id).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.label_en || p.label_ar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Labeled>
            <Labeled label="Open in">
              <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">Same tab</SelectItem>
                  <SelectItem value="_blank">New tab</SelectItem>
                </SelectContent>
              </Select>
            </Labeled>
          </div>
          <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
            <Label>Published</Label>
            <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
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
