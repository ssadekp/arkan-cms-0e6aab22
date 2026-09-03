import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ArrowUp, ArrowDown, Video as VideoIcon } from "lucide-react";
import { embedUrl, parseVideos, videoThumbnail, type VideoItem } from "@/lib/video";

/**
 * Manages a JSON list of videos ([{ url, title, title_en }]).
 * `value` is the JSON string kept in the ResourceManager form state.
 */
export function VideoListEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  let items: VideoItem[] = [];
  try {
    const raw = JSON.parse(value || "[]");
    // Keep rows with an empty url so freshly added (blank) entries stay editable.
    items = Array.isArray(raw)
      ? raw.map((v: any) => (typeof v === "string" ? { url: v } : { url: "", ...(v ?? {}) }))
      : [];
  } catch {
    items = [];
  }

  const commit = (next: VideoItem[]) => onChange(JSON.stringify(next, null, 2));
  const update = (i: number, patch: Partial<VideoItem>) =>
    commit(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => commit([...items, { url: "", title: "", title_en: "" }])}>
          <Plus className="h-4 w-4" /> Add video
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste a YouTube, Vimeo or direct MP4 link (must start with https://).
      </p>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
          No videos yet.
        </div>
      )}

      <div className="space-y-3">
        {items.map((it, i) => {
          const ok = !!embedUrl(it.url);
          const thumb = videoThumbnail(it.url);
          return (
            <div key={i} className="rounded-lg border border-border/60 p-3 space-y-2">
              <div className="flex items-start gap-3">
                <div className="h-16 w-28 shrink-0 rounded bg-muted overflow-hidden grid place-items-center">
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <VideoIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={it.url ?? ""}
                    onChange={(e) => update(i, { url: e.target.value })}
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Input placeholder="العنوان (عربي)" value={it.title ?? ""} onChange={(e) => update(i, { title: e.target.value })} />
                    <Input placeholder="Title (English)" value={it.title_en ?? ""} onChange={(e) => update(i, { title_en: e.target.value })} />
                  </div>
                  {it.url && !ok && (
                    <p className="text-xs text-destructive">Unsupported link — use an https YouTube, Vimeo or .mp4 URL.</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Button type="button" size="icon" variant="ghost" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => commit(items.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
