import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { PdfPages } from "@/components/site/PdfPages";

export type ReadableDocument = {
  title_ar: string;
  title_en: string;
  file_url: string;
};

export function DocumentReader({ document, onClose, lang }: {
  document: ReadableDocument | null;
  onClose: () => void;
  lang: "ar" | "en";
}) {
  const title = document && (lang === "ar" ? document.title_ar || document.title_en : document.title_en || document.title_ar);
  return (
    <Dialog open={!!document} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-6xl w-[calc(100%-2rem)] h-[90dvh] flex flex-col gap-3 p-4 sm:p-6" dir={lang === "ar" ? "rtl" : "ltr"}>
        <DialogTitle className="pe-8 leading-normal break-words">{title}</DialogTitle>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DialogDescription>{lang === "ar" ? "عرض الوثيقة" : "Document preview"}</DialogDescription>
          {document && <Button asChild variant="outline" size="sm"><a href={`${document.file_url}?download=`} download><Download className="h-4 w-4 me-2" />{lang === "ar" ? "تحميل PDF" : "Download PDF"}</a></Button>}
        </div>
        {document && <PdfPages key={document.file_url} url={document.file_url} lang={lang} />}
      </DialogContent>
    </Dialog>
  );
}