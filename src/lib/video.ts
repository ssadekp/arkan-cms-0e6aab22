/**
 * Helpers to turn a pasted video link (YouTube / Vimeo / direct MP4)
 * into a safe embeddable URL plus a poster thumbnail.
 */

export interface VideoItem {
  url: string;
  title?: string;
  title_en?: string;
}

export type VideoProvider = "youtube" | "vimeo" | "file" | "unknown";

export function videoProvider(url: string): VideoProvider {
  if (!url) return "unknown";
  if (/(?:youtube\.com|youtu\.be)/i.test(url)) return "youtube";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return "file";
  return "unknown";
}

export function youtubeId(url: string): string | null {
  const m =
    url.match(/[?&]v=([a-zA-Z0-9_-]{6,})/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/) ||
    url.match(/youtube\.com\/(?:embed|shorts|live)\/([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

export function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d{4,})/);
  return m ? m[1] : null;
}

/** Safe https embed URL, or null when the link isn't recognised. */
export function embedUrl(url: string): string | null {
  const u = (url || "").trim();
  if (!/^https:\/\//i.test(u)) return null;
  const provider = videoProvider(u);
  if (provider === "youtube") {
    const id = youtubeId(u);
    return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
  }
  if (provider === "vimeo") {
    const id = vimeoId(u);
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  if (provider === "file") return u;
  return null;
}

/** Auto thumbnail when the provider offers one. */
export function videoThumbnail(url: string): string | null {
  const id = youtubeId(url || "");
  if (id) return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  return null;
}

/** Normalise the stored jsonb value into a list of video items. */
export function parseVideos(value: unknown): VideoItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => (typeof v === "string" ? { url: v } : v))
    .filter((v): v is VideoItem => !!v && typeof (v as any).url === "string" && !!(v as any).url);
}
