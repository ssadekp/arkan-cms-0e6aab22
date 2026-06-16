import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  images: string[];
  className?: string;
  imgClassName?: string;
  alts?: string[];
};

export function LightboxGallery({ images, className, imgClassName, alts }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(
    () => setIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length],
  );
  const prev = useCallback(
    () => setIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close, next, prev]);

  return (
    <>
      <div className={className}>
        {images.map((src, i) => (
          <button
            type="button"
            key={i}
            onClick={() => setIndex(i)}
            className="group block overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <img
              src={src}
              alt={alts?.[i] ?? ""}
              loading="lazy"
              className={
                imgClassName ??
                "h-full w-full aspect-square object-cover transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
              }
            />
          </button>
        ))}
      </div>

      {open && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={close}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 p-2 text-white/80 hover:text-white"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 p-2 text-white/80 hover:text-white"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
            <img
              src={images[index!]}
              alt={alts?.[index!] ?? ""}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] max-w-[92vw] object-contain rounded-md shadow-2xl"
            />
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
                {index! + 1} / {images.length}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
