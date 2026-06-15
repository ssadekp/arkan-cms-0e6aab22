import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "site-media";

async function uploadFile(file: File, folder = "uploads"): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function ImageUpload({
  label,
  value,
  onChange,
  folder = "uploads",
  accept = "image/*",
  help,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (url: string) => void;
  folder?: string;
  accept?: string;
  help?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true);
    try {
      const url = await uploadFile(f, folder);
      onChange(url);
      toast.success("Uploaded");
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="rounded-md border border-border/60 p-3 space-y-2 bg-background">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded border border-border/60 bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
            {value ? (
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              {busy ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Upload className="h-4 w-4 me-2" />}
              {value ? "Replace" : "Upload"}
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                <X className="h-4 w-4 me-1" /> Clear
              </Button>
            )}
            <input ref={fileRef} type="file" accept={accept} hidden onChange={onFile} />
          </div>
        </div>
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Or paste a URL"
          className="text-xs"
        />
        {help && <p className="text-xs text-muted-foreground">{help}</p>}
      </div>
    </div>
  );
}

export function GalleryUpload({
  label,
  value,
  onChange,
  folder = "gallery",
}: {
  label: string;
  value: string; // JSON string of array
  onChange: (json: string) => void;
  folder?: string;
}) {
  let urls: string[] = [];
  try {
    const p = JSON.parse(value || "[]");
    if (Array.isArray(p)) urls = p.filter((x) => typeof x === "string");
  } catch {
    urls = [];
  }
  const set = (next: string[]) => onChange(JSON.stringify(next));

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    setBusy(true);
    setProgress({ done: 0, total: files.length });
    const added: string[] = [];
    try {
      for (const f of files) {
        try {
          const u = await uploadFile(f, folder);
          added.push(u);
        } catch (err: any) {
          toast.error(`${f.name}: ${err.message ?? "failed"}`);
        }
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      if (added.length) {
        set([...urls, ...added]);
        toast.success(`Uploaded ${added.length} image${added.length === 1 ? "" : "s"}`);
      }
    } finally {
      setBusy(false);
      setProgress({ done: 0, total: 0 });
    }
  }

  function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= urls.length) return;
    const next = [...urls];
    [next[idx], next[j]] = [next[j], next[idx]];
    set(next);
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="rounded-md border border-border/60 p-3 space-y-3 bg-background">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
            {busy ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Upload className="h-4 w-4 me-2" />}
            Upload images
          </Button>
          {busy && (
            <span className="text-xs text-muted-foreground">
              {progress.done}/{progress.total}
            </span>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onFiles} />
        </div>

        {urls.length === 0 ? (
          <p className="text-xs text-muted-foreground">No images yet. Select multiple files at once to add them in bulk.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {urls.map((u, idx) => (
              <div key={idx} className="rounded-md border border-border/60 overflow-hidden bg-muted/30">
                <div className="aspect-video bg-muted/40">
                  {u ? <img src={u} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="p-2 space-y-1.5">
                  <Input
                    value={u}
                    onChange={(e) => {
                      const n = [...urls];
                      n[idx] = e.target.value;
                      set(n);
                    }}
                    className="text-xs h-7"
                  />
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</Button>
                      <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => move(idx, 1)} disabled={idx === urls.length - 1}>↓</Button>
                    </div>
                    <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-xs text-destructive" onClick={() => set(urls.filter((_, i) => i !== idx))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
