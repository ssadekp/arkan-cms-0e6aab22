import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAll, saveResource, deleteResource, setProjectTags, setProjectPartners, setFocusAreaPartners } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { RichEditor } from "./RichEditor";


type Table = "pages" | "focus_areas" | "projects" | "news" | "partners" | "homepage_stats";

export interface FieldSpec {
  key: string;
  label: string;
  type?: "text" | "textarea" | "rich" | "url" | "number" | "boolean" | "image" | "gallery" | "select" | "enum" | "tags" | "partners";
  options?: { value: string; label: string }[];
  i18n?: boolean;
}

interface Props {
  table: Table;
  title: string;
  rootFields: FieldSpec[];
  i18nFields: FieldSpec[];
  hasI18n?: boolean;
  listLabel?: (row: any, i18nRows: any[]) => string;
}

export function ResourceManager({ table, title, rootFields, i18nFields, hasI18n = true, listLabel }: Props) {
  const fn = useServerFn(adminListAll);
  const save = useServerFn(saveResource);
  const del = useServerFn(deleteResource);
  const saveTagsFn = useServerFn(setProjectTags);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn(), staleTime: 5_000 });

  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({});
  const [i18n, setI18n] = useState<{ ar: any; en: any }>({ ar: {}, en: {} });
  const [tagIds, setTagIds] = useState<string[]>([]);

  const rows: any[] = (data as any)?.[tableKey(table)] ?? [];
  const i18nRows: any[] =
    table === "partners" ? [] : (data as any)?.[`${tableKey(table)}I18n` as any] ?? [];
  const allTags: any[] = (data as any)?.tags ?? [];
  const allTagsI18n: any[] = (data as any)?.tagsI18n ?? [];
  const allProjectTags: any[] = (data as any)?.projectTags ?? [];

  function openNew() {
    setEditing({ __new: true });
    const initial: any = {};
    rootFields.forEach((f) => {
      initial[f.key] = f.type === "boolean" ? true : f.type === "number" ? 0 : f.type === "gallery" ? "[]" : "";
    });
    setForm(initial);
    setI18n({ ar: emptyI18n(i18nFields), en: emptyI18n(i18nFields) });
    setTagIds([]);
  }

  function openEdit(row: any) {
    setEditing(row);
    const f: any = {};
    rootFields.forEach((fld) => {
      if (fld.type === "gallery") {
        f[fld.key] = JSON.stringify(row[fld.key] ?? [], null, 2);
      } else if (fld.type === "boolean") {
        f[fld.key] = !!row[fld.key];
      } else {
        f[fld.key] = row[fld.key] ?? "";
      }
    });
    setForm(f);
    const arRow = i18nRows.find((x: any) => x[fkOf(table)] === row.id && x.lang === "ar") ?? emptyI18n(i18nFields);
    const enRow = i18nRows.find((x: any) => x[fkOf(table)] === row.id && x.lang === "en") ?? emptyI18n(i18nFields);
    setI18n({ ar: arRow, en: enRow });
    if (table === "projects") {
      setTagIds(allProjectTags.filter((pt) => pt.project_id === row.id).map((pt) => pt.tag_id));
    } else {
      setTagIds([]);
    }
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const values: any = {};
      rootFields.forEach((f) => {
        if (f.type === "tags") return;
        let v = form[f.key];
        if (f.type === "number") v = Number(v) || 0;
        if (f.type === "boolean") v = !!v;
        if (f.type === "gallery") { try { v = JSON.parse(v || "[]"); } catch { v = []; } }
        values[f.key] = v === "" ? null : v;
      });
      const i18nArr = hasI18n ? (["ar", "en"] as const).map((l) => {
        const obj: any = { lang: l };
        i18nFields.forEach((f) => { obj[f.key] = (i18n as any)[l][f.key] ?? ""; });
        return obj;
      }) : undefined;
      const result = await save({ data: { table, id: editing?.__new ? null : editing.id, values, i18n: i18nArr } });
      if (table === "projects" && result?.id) {
        await saveTagsFn({ data: { project_id: result.id, tag_ids: tagIds } });
      }
      return result;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin-all"] });
      qc.invalidateQueries({ queryKey: ["home-data"] });
      qc.invalidateQueries({ queryKey: ["site-data"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { table, id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-all"] });
      qc.invalidateQueries({ queryKey: ["home-data"] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Button onClick={openNew}><Plus className="h-4 w-4 me-2" /> New</Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/60">
        {isLoading && <div className="p-4 text-sm text-muted-foreground">Loading...</div>}
        {!isLoading && rows.length === 0 && <div className="p-6 text-sm text-muted-foreground">No items yet.</div>}
        {rows.map((row) => {
          const label = listLabel ? listLabel(row, i18nRows) : (row.name ?? row.slug ?? row.id);
          return (
            <div key={row.id} className="flex items-center justify-between p-4 gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{label}</div>
                {row.slug && <div className="text-xs text-muted-foreground">/{row.slug}</div>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(row)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => confirm("Delete?") && delMut.mutate(row.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.__new ? "New" : "Edit"} {title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {rootFields.map((f) => {
              if (f.type === "tags") {
                return (
                  <TagsPicker
                    key={f.key}
                    label={f.label}
                    selected={tagIds}
                    onChange={setTagIds}
                    allTags={allTags}
                    allTagsI18n={allTagsI18n}
                  />
                );
              }
              return (
                <FieldInput key={f.key} field={f} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} />
              );
            })}

            {hasI18n && (
              <Tabs defaultValue="ar">
                <TabsList>
                  <TabsTrigger value="ar">العربية</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                </TabsList>
                {(["ar", "en"] as const).map((l) => (
                  <TabsContent key={l} value={l} className="space-y-3 pt-3">
                    {i18nFields.map((f) => (
                      <FieldInput
                        key={f.key}
                        field={f}
                        value={(i18n as any)[l][f.key] ?? ""}
                        onChange={(v) => setI18n({ ...i18n, [l]: { ...(i18n as any)[l], [f.key]: v } })}
                      />
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldInput({ field, value, onChange }: { field: FieldSpec; value: any; onChange: (v: any) => void }) {
  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
        <Label>{field.label}</Label>
        <Switch checked={!!value} onCheckedChange={onChange} />
      </div>
    );
  }
  if (field.type === "rich") {
    return (
      <div className="space-y-1.5">
        <Label>{field.label}</Label>
        <RichEditor value={value ?? ""} onChange={onChange} />
      </div>
    );
  }
  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label>{field.label}</Label>
        <Textarea rows={4} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  if (field.type === "select" || field.type === "enum") {
    return (
      <div className="space-y-1.5">
        <Label>{field.label}</Label>
        <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {field.type === "select" && <option value="">—</option>}
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
    );
  }
  if (field.type === "gallery") {
    return (
      <div className="space-y-1.5">
        <Label>{field.label}</Label>
        <GalleryEditor value={value ?? "[]"} onChange={onChange} />
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <Label>{field.label}</Label>
      <Input type={field.type === "number" ? "number" : "text"} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function GalleryEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  let urls: string[] = [];
  try { urls = JSON.parse(value || "[]"); if (!Array.isArray(urls)) urls = []; } catch { urls = []; }
  const set = (next: string[]) => onChange(JSON.stringify(next));
  return (
    <div className="space-y-2">
      {urls.map((u, idx) => (
        <div key={idx} className="flex gap-2">
          <Input value={u} onChange={(e) => {
            const n = [...urls]; n[idx] = e.target.value; set(n);
          }} placeholder="https://..." />
          <Button type="button" variant="outline" size="icon" onClick={() => set(urls.filter((_, i) => i !== idx))}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => set([...urls, ""])}>
        <Plus className="h-4 w-4 me-2" /> Add image URL
      </Button>
    </div>
  );
}

function TagsPicker({
  label, selected, onChange, allTags, allTagsI18n,
}: { label: string; selected: string[]; onChange: (ids: string[]) => void; allTags: any[]; allTagsI18n: any[] }) {
  const nameOf = (id: string) => {
    const ar = allTagsI18n.find((x) => x.tag_id === id && x.lang === "ar")?.name;
    const en = allTagsI18n.find((x) => x.tag_id === id && x.lang === "en")?.name;
    return ar || en || allTags.find((t) => t.id === id)?.slug || id;
  };
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {allTags.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No tags yet. Create them under <a href="/admin/tags" className="underline">Tags</a>.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {allTags.map((t) => {
          const active = selected.includes(t.id);
          return (
            <button
              type="button"
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`rounded-full px-3 py-1 text-xs border transition ${
                active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border/60 hover:border-primary/60"
              }`}
            >
              {nameOf(t.id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function tableKey(t: Table) {
  return t === "focus_areas" ? "focus" : t === "homepage_stats" ? "stats" : t;
}
function fkOf(t: Table) {
  return ({ pages: "page_id", focus_areas: "focus_area_id", projects: "project_id", news: "news_id", homepage_stats: "stat_id", partners: "" } as const)[t];
}
function emptyI18n(fields: FieldSpec[]) { const o: any = {}; fields.forEach((f) => (o[f.key] = "")); return o; }
