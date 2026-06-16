import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { SOCIAL_PLATFORMS, SocialIcon, type SocialPlatform } from "@/components/site/SocialIcon";

export const Route = createFileRoute("/_authenticated/admin/social-links")({
  component: () => (
    <AdminShell title="Social Media Links">
      <SocialLinksAdmin />
    </AdminShell>
  ),
});

function SocialLinksAdmin() {
  const qc = useQueryClient();
  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-social-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return toast.error("URL is required");
    try {
      new URL(url.trim());
    } catch {
      return toast.error("Please enter a valid URL");
    }
    setBusy(true);
    try {
      const def = SOCIAL_PLATFORMS.find((p) => p.value === platform)!;
      const { error } = await supabase.from("social_links").insert({
        platform_name: def.label,
        platform_icon: def.value,
        url: url.trim(),
      });
      if (error) throw error;
      toast.success("Link added");
      setUrl("");
      setPlatform("facebook");
      qc.invalidateQueries({ queryKey: ["admin-social-links"] });
      qc.invalidateQueries({ queryKey: ["site-social-links"] });
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this link?")) return;
    const { error } = await supabase.from("social_links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-social-links"] });
    qc.invalidateQueries({ queryKey: ["site-social-links"] });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Add Social Media Link</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onAdd} className="grid gap-4 md:grid-cols-[200px_1fr_auto] items-end">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOCIAL_PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="inline-flex items-center gap-2">
                        <SocialIcon platform={p.value} className="h-4 w-4" />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>All Social Links</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : !data?.length ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No social links yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 font-medium">
                        <SocialIcon platform={row.platform_icon as SocialPlatform} className="h-4 w-4" />
                        {row.platform_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                        {row.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => onDelete(row.id)}>
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
