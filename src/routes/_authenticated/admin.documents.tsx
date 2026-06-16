import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, Trash2, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const BUCKET = "charity-docs";

type Category = "regulation" | "form" | "achievement";

const CATEGORY_LABELS: Record<Category, string> = {
  regulation: "Regulations",
  form: "Forms",
  achievement: "Achievements",
};

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: () => (
    <AdminShell title="Documents">
      <DocumentsAdmin />
    </AdminShell>
  ),
});

function DocumentsAdmin() {
  const qc = useQueryClient();
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [category, setCategory] = useState<Category>("regulation");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titleAr.trim()) return toast.error("Arabic title is required");
    if (!titleEn.trim()) return toast.error("English title is required");
    if (!file) return toast.error("Please choose a PDF file");
    if (file.type !== "application/pdf") return toast.error("Only PDF files are allowed");

    setBusy(true);
    try {
      const path = `${category}/${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: insErr } = await supabase
        .from("documents")
        .insert({
          title_ar: titleAr.trim(),
          title_en: titleEn.trim(),
          category,
          file_url: urlData.publicUrl,
        });
      if (insErr) throw new Error(insErr.message);
      toast.success("Document uploaded");
      setTitleAr("");
      setTitleEn("");
      setCategory("regulation");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["admin-documents"] });
      qc.invalidateQueries({ queryKey: ["public-documents"] });
    } catch (err: any) {
      toast.error(err.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string, fileUrl: string) {
    if (!confirm("Delete this document?")) return;
    try {
      const marker = `/${BUCKET}/`;
      const idx = fileUrl.indexOf(marker);
      if (idx !== -1) {
        const path = fileUrl.slice(idx + marker.length);
        await supabase.storage.from(BUCKET).remove([path]);
      }
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-documents"] });
      qc.invalidateQueries({ queryKey: ["public-documents"] });
    } catch (err: any) {
      toast.error(err.message ?? "Delete failed");
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Document</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Arabic Title *</Label>
              <Input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} placeholder="عنوان الوثيقة" dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <Label>English Title *</Label>
              <Input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="Document title" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regulation">Regulations</SelectItem>
                  <SelectItem value="form">Forms</SelectItem>
                  <SelectItem value="achievement">Achievements</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>PDF File</Label>
              <Input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Upload className="h-4 w-4 me-2" />}
                Upload Document
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Documents</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !data?.length ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No documents yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Arabic Title</TableHead>
                  <TableHead>English Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium" dir="rtl">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        {doc.title_ar}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{doc.title_en}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{CATEGORY_LABELS[doc.category as Category]}</Badge>
                    </TableCell>
                    <TableCell>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline text-sm">
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(doc.id, doc.file_url)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
