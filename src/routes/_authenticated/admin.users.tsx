import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUsers, createUser, updateUser, deleteUser, canSelfPromote, promoteSelfToSuperAdmin, adminSetUserPassword } from "@/lib/users.functions";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Pencil, Trash2, UserPlus, Eye, Power, ShieldCheck, KeyRound, Upload, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: UsersPage,
});

const ROLES = ["super_admin", "admin", "editor", "author", "user"] as const;
type Role = (typeof ROLES)[number];

function UsersPage() {
  const { t, lang } = useI18n();
  const fn = useServerFn(listUsers);
  const createFn = useServerFn(createUser);
  const updateFn = useServerFn(updateUser);
  const deleteFn = useServerFn(deleteUser);
  const canPromoteFn = useServerFn(canSelfPromote);
  const promoteFn = useServerFn(promoteSelfToSuperAdmin);
  const passwordFn = useServerFn(adminSetUserPassword);
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [pwUser, setPwUser] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () => fn({ data: { search, role: roleFilter } }),
    staleTime: 30_000,
  });

  const callerRoles: Role[] = (data?.callerRoles as Role[]) ?? [];
  const isSuper = callerRoles.includes("super_admin");
  const isAdmin = callerRoles.includes("admin");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const { data: promoStatus } = useQuery({
    queryKey: ["can-self-promote"],
    queryFn: () => canPromoteFn(),
  });
  const promoteMut = useMutation({
    mutationFn: () => promoteFn(),
    onSuccess: () => {
      toast.success("You are now Super Admin");
      qc.invalidateQueries({ queryKey: ["can-self-promote"] });
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => createFn({ data: payload }),
    onSuccess: () => { toast.success("User created"); setAddOpen(false); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: (payload: any) => updateFn({ data: payload }),
    onSuccess: () => { toast.success("Saved"); setEditUser(null); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });
  const passwordMut = useMutation({
    mutationFn: (payload: { id: string; password: string }) => passwordFn({ data: payload }),
    onSuccess: () => { toast.success(t("users.passwordUpdated")); setPwUser(null); },
    onError: (e: any) => toast.error(e.message),
  });
  const toggleStatus = (u: any) =>
    updateMut.mutate({ id: u.id, status: u.status === "active" ? "inactive" : "active" });

  return (
    <AdminShell title={t("users.title")}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder={t("users.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("users.filterRole")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("users.allRoles")}</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>{t(`users.role.${r}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ms-auto flex items-center gap-2">
            {promoStatus?.eligible && (
              <Button
                variant="outline"
                onClick={() => promoteMut.mutate()}
                disabled={promoteMut.isPending}
                title="One-time: become Super Admin (no super admin exists yet)"
              >
                <ShieldCheck className="h-4 w-4" />
                {promoteMut.isPending ? "Promoting…" : "Promote me to Super Admin"}
              </Button>
            )}
            {isSuper && (
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button><UserPlus className="h-4 w-4" />{t("users.addUser")}</Button>
                </DialogTrigger>
                <UserDialog
                  title={t("users.addUser")}
                  mode="create"
                  onSubmit={(p) => createMut.mutate(p)}
                  pending={createMut.isPending}
                />
              </Dialog>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("users.fullName")}</TableHead>
                <TableHead>{t("users.email")}</TableHead>
                <TableHead>{t("users.phone")}</TableHead>
                <TableHead>{t("users.role")}</TableHead>
                <TableHead>{t("users.status")}</TableHead>
                <TableHead>{t("users.createdAt")}</TableHead>
                <TableHead>{t("users.lastLogin")}</TableHead>
                <TableHead className="text-end">{t("users.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">{t("common.loading")}</TableCell></TableRow>
              ) : (data?.users ?? []).length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-sm text-muted-foreground">{t("users.noUsers")}</TableCell></TableRow>
              ) : (
                data!.users.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar_url ?? undefined} />
                          <AvatarFallback>{(u.full_name || u.email || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{u.full_name || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell className="text-sm">{u.phone || "—"}</TableCell>
                    <TableCell>
                      {u.roles.length > 0
                        ? u.roles.map((r: Role) => <Badge key={r} variant="secondary" className="me-1">{t(`users.role.${r}`)}</Badge>)
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.status === "active" ? "default" : "outline"}>
                        {t(`users.status.${u.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(u.created_at, lang)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.last_login_at ? fmtDate(u.last_login_at, lang) : "—"}</TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setViewUser(u)} title={t("users.viewProfile")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(isSuper || isAdmin) && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => setEditUser(u)} title={t("users.editUser")}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setPwUser(u)} title={t("users.resetPassword")}>
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => toggleStatus(u)} title={u.status === "active" ? t("users.deactivate") : t("users.activate")}>
                              <Power className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {isSuper && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-destructive" title={t("users.deleteUser")}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("users.deleteUser")}</AlertDialogTitle>
                                <AlertDialogDescription>{t("users.deleteConfirm")}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteMut.mutate(u.id)}>{t("common.delete")}</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {editUser && (
          <Dialog open onOpenChange={(o) => !o && setEditUser(null)}>
            <UserDialog
              title={t("users.editUser")}
              mode="edit"
              initial={editUser}
              canEditRole={isSuper}
              onSubmit={(p) => updateMut.mutate({ ...p, id: editUser.id })}
              pending={updateMut.isPending}
            />
          </Dialog>
        )}

        <PasswordResetDialog
          user={pwUser}
          onClose={() => setPwUser(null)}
          onSubmit={(password: string) => passwordMut.mutate({ id: pwUser.id, password })}
          pending={passwordMut.isPending}
        />

        <Sheet open={!!viewUser} onOpenChange={(o) => !o && setViewUser(null)}>
          <SheetContent>
            <SheetHeader><SheetTitle>{t("users.viewProfile")}</SheetTitle></SheetHeader>
            {viewUser && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={viewUser.avatar_url ?? undefined} />
                    <AvatarFallback>{(viewUser.full_name || viewUser.email || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{viewUser.full_name || "—"}</div>
                    <div className="text-sm text-muted-foreground">{viewUser.email}</div>
                  </div>
                </div>
                <Row label={t("users.phone")} value={viewUser.phone || "—"} />
                <Row label={t("users.role")} value={viewUser.roles.map((r: Role) => t(`users.role.${r}`)).join(", ") || "—"} />
                <Row label={t("users.status")} value={t(`users.status.${viewUser.status}`)} />
                <Row label={t("users.createdAt")} value={fmtDate(viewUser.created_at, lang)} />
                <Row label={t("users.lastLogin")} value={viewUser.last_login_at ? fmtDate(viewUser.last_login_at, lang) : "—"} />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/40 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function fmtDate(s: string, lang: string) {
  try { return new Date(s).toLocaleString(lang === "ar" ? "ar-EG" : "en-US"); } catch { return s; }
}

function UserDialog({
  title, mode, initial, canEditRole = true, onSubmit, pending,
}: {
  title: string;
  mode: "create" | "edit";
  initial?: any;
  canEditRole?: boolean;
  onSubmit: (payload: any) => void;
  pending?: boolean;
}) {
  const { t } = useI18n();
  const [full_name, setFullName] = useState(initial?.full_name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [avatar_url, setAvatarUrl] = useState(initial?.avatar_url ?? "");
  const [role, setRole] = useState<Role>((initial?.roles?.[0] as Role) ?? "editor");
  const [status, setStatus] = useState<"active" | "inactive">((initial?.status as any) ?? "active");

  const submit = () => {
    if (mode === "create") {
      onSubmit({ email, password, full_name, phone, avatar_url: avatar_url || null, role });
    } else {
      const payload: any = { full_name, phone, avatar_url: avatar_url || null, status };
      if (canEditRole) payload.role = role;
      onSubmit(payload);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <FieldRow label={t("users.fullName")}>
          <Input value={full_name} onChange={(e) => setFullName(e.target.value)} />
        </FieldRow>
        <FieldRow label={t("users.email")}>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={mode === "edit"} />
        </FieldRow>
        {mode === "create" && (
          <FieldRow label={t("users.password")}>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </FieldRow>
        )}
        <FieldRow label={t("users.phone")}>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </FieldRow>
        <FieldRow label={t("users.avatar")}>
          <AvatarUpload value={avatar_url} onChange={setAvatarUrl} />
        </FieldRow>
        {canEditRole && (
          <FieldRow label={t("users.role")}>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{t(`users.role.${r}`)}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldRow>
        )}
        {mode === "edit" && (
          <FieldRow label={t("users.status")}>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("users.status.active")}</SelectItem>
                <SelectItem value="inactive">{t("users.status.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        )}
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={pending}>{pending ? t("common.loading") : t("common.save")}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function AvatarUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  async function pick(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image");
    if (file.size > 5 * 1024 * 1024) return toast.error("Max file size is 5 MB");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("user-avatars").upload(path, file, {
        contentType: file.type, upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("user-avatars").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Photo uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-14 w-14">
        <AvatarImage src={value || undefined} />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <Input
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
        {value && (
          <button type="button" className="text-xs text-muted-foreground hover:text-destructive mt-1" onClick={() => onChange("")}>
            Remove photo
          </button>
        )}
      </div>
      {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    </div>
  );
}

function PasswordResetDialog({
  user, onClose, onSubmit, pending,
}: {
  user: any | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
  pending?: boolean;
}) {
  const { t } = useI18n();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  function submit() {
    if (pw.length < 8) return toast.error(t("users.passwordTooShort"));
    if (pw !== pw2) return toast.error(t("users.passwordMismatch"));
    onSubmit(pw);
  }
  return (
    <Dialog open={!!user} onOpenChange={(o) => { if (!o) { setPw(""); setPw2(""); onClose(); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("users.resetPassword")}</DialogTitle>
        </DialogHeader>
        {user && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {user.full_name || user.email}
            </p>
            <FieldRow label={t("users.newPassword")}>
              <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
            </FieldRow>
            <FieldRow label={t("users.confirmPassword")}>
              <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </FieldRow>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <KeyRound className="h-4 w-4 me-2" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

