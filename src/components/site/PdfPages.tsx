import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFDocumentProxy } from "pdfjs-dist";

export function PdfPages({ url, lang }: { url: string; lang: "ar" | "en" }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => { if (entry) setWidth(entry.contentRect.width); });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let task: ReturnType<typeof import("pdfjs-dist").getDocument> | undefined;
    setBusy(true); setError(false); setPage(1);
    import("pdfjs-dist").then((library) => {
      if (cancelled) return;
      library.GlobalWorkerOptions.workerSrc = workerUrl;
      task = library.getDocument({ url });
      return task.promise.then((document) => { if (!cancelled) setPdf(document); });
    }).catch(() => { if (!cancelled) { setError(true); setBusy(false); } });
    return () => { cancelled = true; void task?.destroy(); };
  }, [url]);

  useEffect(() => {
    const element = canvas.current;
    if (!pdf || !element || !width) return;
    let cancelled = false;
    let render: ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]> | undefined;
    setBusy(true);
    pdf.getPage(page).then((pdfPage) => {
      if (cancelled) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: Math.max(0.1, (width - 24) / base.width) * zoom });
      const ratio = window.devicePixelRatio || 1;
      element.width = Math.floor(viewport.width * ratio);
      element.height = Math.floor(viewport.height * ratio);
      element.style.width = `${viewport.width}px`;
      element.style.height = `${viewport.height}px`;
      render = pdfPage.render({ canvas: element, viewport, transform: [ratio, 0, 0, ratio, 0, 0] });
      return render.promise;
    }).then(() => { if (!cancelled) setBusy(false); }).catch(() => { if (!cancelled) { setError(true); setBusy(false); } });
    return () => { cancelled = true; render?.cancel(); };
  }, [pdf, page, width, zoom]);

  return <div className="flex flex-col flex-1 min-h-0 gap-2">
    <div className="flex items-center justify-center gap-2 flex-wrap" dir="ltr">
      <Button variant="outline" size="icon" aria-label={lang === "ar" ? "الصفحة السابقة" : "Previous page"} disabled={!pdf || page === 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
      <span className="text-sm tabular-nums min-w-16 text-center">{page} / {pdf?.numPages ?? "—"}</span>
      <Button variant="outline" size="icon" aria-label={lang === "ar" ? "الصفحة التالية" : "Next page"} disabled={!pdf || page >= pdf.numPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" aria-label={lang === "ar" ? "تصغير" : "Zoom out"} disabled={zoom <= 0.5} onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}><ZoomOut className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon" aria-label={lang === "ar" ? "تكبير" : "Zoom in"} disabled={zoom >= 2} onClick={() => setZoom(Math.min(2, zoom + 0.25))}><ZoomIn className="h-4 w-4" /></Button>
    </div>
    <div ref={container} className="flex-1 min-h-0 overflow-auto rounded-md border border-border bg-muted p-3" aria-busy={busy}>
      {busy && <div role="status" className="flex justify-center p-3"><Loader2 className="h-5 w-5 animate-spin" /><span className="sr-only">{lang === "ar" ? "جار تحميل الوثيقة" : "Loading document"}</span></div>}
      {error ? <p role="alert" className="text-center p-4 text-muted-foreground">{lang === "ar" ? "تعذر عرض الوثيقة. يمكنك تحميل الملف." : "Unable to preview this document. You can download the file."}</p> : <canvas ref={canvas} aria-label={lang === "ar" ? `صفحة ${page}` : `Page ${page}`} className="mx-auto" />}
    </div>
  </div>;
}