import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListDonations, updateDonationStatus, deleteDonation } from "@/lib/support.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Download, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/donations")({
  component: DonationsAdmin,
});

const STATUSES = ["new", "contacted", "received", "cancelled"] as const;

function DonationsAdmin() {
  const list = useServerFn(adminListDonations);
  const setStatus = useServerFn(updateDonationStatus);
  const del = useServerFn(deleteDonation);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-donations"], queryFn: () => list() });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const rows = useMemo(() => {
    let list = ((data?.donations as any[]) ?? []);
    if (filter !== "all") list = list.filter((d) => d.status === filter);
    const term = q.trim().toLowerCase();
    if (term) list = list.filter((d) => `${d.name} ${d.phone} ${d.email ?? ""}`.toLowerCase().includes(term));
    return list;
  }, [data, q, filter]);

  const totals = useMemo(() => {
    const all = (data?.donations as any[]) ?? [];
    const sum = (arr: any[]) => arr.reduce((t, d) => t + Number(d.amount || 0), 0);
    return {
      count: all.length,
      pledged: sum(all),
      received: sum(all.filter((d) => d.status === "received")),
      currency: all[0]?.currency ?? "EGP",
    };
  }, [data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-donations"] });

  const exportExcel = async () => {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.json_to_sheet(rows.map((d) => ({
      Date: new Date(d.created_at).toLocaleString(),
      Name: d.name,
      Phone: d.phone,
      Email: d.email ?? "",
      Amount: Number(d.amount),
      Currency: d.currency,
      Status: d.status,
      Notes: d.note ?? "",
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Donations");
    XLSX.writeFile(wb, `donations-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <AdminShell title="Donations">
      <div className="space-y-5">
        <div className="grid sm:grid-cols-3 gap-3">
          <Stat label="Donations" value={String(totals.count)} />
          <Stat label={`Pledged (${totals.currency})`} value={totals.pledged.toLocaleString()} />
          <Stat label={`Received (${totals.currency})`} value={totals.received.toLocaleString()} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
            <Input className="ps-9" placeholder="Search name, phone, email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportExcel} disabled={rows.length === 0}>
            <Download className="h-4 w-4 me-1" /> Export to Excel
          </Button>
        </div>

        <div className="rounded-lg border border-border/60 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {d.name}
                    {d.note && <div className="text-xs text-muted-foreground max-w-[220px] truncate">{d.note}</div>}
                  </TableCell>
                  <TableCell dir="ltr">{d.phone}</TableCell>
                  <TableCell dir="ltr">{d.email ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap">{Number(d.amount).toLocaleString()} {d.currency}</TableCell>
                  <TableCell>
                    <Select
                      value={d.status}
                      onValueChange={async (v) => {
                        try {
                          await setStatus({ data: { id: d.id, status: v as any } });
                          invalidate();
                        } catch (e: any) { toast.error(e.message); }
                      }}
                    >
                      <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon" aria-label="Delete"
                      onClick={async () => {
                        if (!confirm("Delete this donation record?")) return;
                        await del({ data: { id: d.id } });
                        invalidate();
                      }}
                    ><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No donations yet.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
