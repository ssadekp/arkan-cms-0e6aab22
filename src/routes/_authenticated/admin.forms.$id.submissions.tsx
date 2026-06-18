import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListSubmissions, deleteSubmission } from "@/lib/forms.functions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Download, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_authenticated/admin/forms/$id/submissions")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { id } = Route.useParams();
  const list = useServerFn(adminListSubmissions);
  const del = useServerFn(deleteSubmission);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-form-subs", id], queryFn: () => list({ data: { form_id: id } }) });

  const form: any = data?.form;
  const fields = ((data?.fields ?? []) as any[]).sort((a, b) => a.position - b.position);
  const subs = (data?.submissions ?? []) as any[];

  const onDelete = async (sid: string) => {
    if (!confirm("Delete this submission?")) return;
    await del({ data: { id: sid } });
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-form-subs", id] });
  };

  const exportExcel = () => {
    if (subs.length === 0) return toast.error("No submissions to export");
    const rows = subs.map((s) => {
      const r: Record<string, any> = {
        "Submitted at": new Date(s.created_at).toLocaleString(),
      };
      fields.forEach((f) => {
        const v = s.data?.[f.field_key];
        r[f.label_en || f.field_key] = Array.isArray(v) ? v.join(", ") : (v ?? "");
      });
      const files = (s.files ?? []) as any[];
      if (files.length) r["Files"] = files.map((f) => f.url || f.name).join(" | ");
      return r;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(wb, `${form?.slug ?? "form"}-submissions.xlsx`);
  };

  return (
    <AdminShell title={form ? `Submissions: ${form.title_en || form.slug}` : "Submissions"}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/forms"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 me-1" />All forms</Button></Link>
          <Link to="/admin/forms/$id" params={{ id }}><Button variant="outline" size="sm">Edit fields</Button></Link>
          <div className="ms-auto">
            <Button onClick={exportExcel}><Download className="h-4 w-4 me-1" />Export to Excel</Button>
          </div>
        </div>

        {subs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">No submissions yet.</div>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  {fields.slice(0, 4).map((f) => <TableHead key={f.id}>{f.label_en || f.field_key}</TableHead>)}
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subs.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(s.created_at).toLocaleString()}</TableCell>
                    {fields.slice(0, 4).map((f) => {
                      const v = s.data?.[f.field_key];
                      return <TableCell key={f.id} className="text-sm max-w-xs truncate">{Array.isArray(v) ? v.join(", ") : String(v ?? "")}</TableCell>;
                    })}
                    <TableCell className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Submission details</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <div className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</div>
                            {fields.map((f) => {
                              const v = s.data?.[f.field_key];
                              return (
                                <div key={f.id}>
                                  <div className="text-xs font-medium">{f.label_en || f.field_key}</div>
                                  <div className="text-sm whitespace-pre-wrap break-words">{Array.isArray(v) ? v.join(", ") : String(v ?? "—")}</div>
                                </div>
                              );
                            })}
                            {((s.files ?? []) as any[]).length > 0 && (
                              <div>
                                <div className="text-xs font-medium">Files</div>
                                <ul className="text-sm space-y-1">
                                  {(s.files as any[]).map((f, i) => (
                                    <li key={i}>{f.url ? <a className="text-primary underline" href={f.url} target="_blank" rel="noreferrer">{f.name}</a> : f.name}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
