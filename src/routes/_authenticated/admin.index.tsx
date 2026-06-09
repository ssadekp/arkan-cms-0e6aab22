import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAll, getMyRoles } from "@/lib/admin.functions";
import { FileText, Target, FolderKanban, Users, Newspaper, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

function AdminHome() {
  const fn = useServerFn(adminListAll);
  const rolesFn = useServerFn(getMyRoles);
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn() });
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });

  if (roles && roles.length === 0) {
    return (
      <AdminShell title="Access denied">
        <div className="max-w-md rounded-xl border border-border/60 bg-card p-6">
          <ShieldCheck className="h-6 w-6 text-primary mb-3" />
          <h2 className="font-semibold">No staff role assigned</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account doesn't have admin or editor access. Ask an existing admin to grant you a role.
            The first user to sign up is automatically promoted to admin.
          </p>
        </div>
      </AdminShell>
    );
  }

  const stats = [
    { label: "Pages", value: data?.pages.length ?? 0, icon: FileText, to: "/admin/pages" },
    { label: "Focus Areas", value: data?.focus.length ?? 0, icon: Target, to: "/admin/focus-areas" },
    { label: "Projects", value: data?.projects.length ?? 0, icon: FolderKanban, to: "/admin/projects" },
    { label: "Partners", value: data?.partners.length ?? 0, icon: Users, to: "/admin/partners" },
    { label: "News", value: data?.news.length ?? 0, icon: Newspaper, to: "/admin/news" },
  ];

  return (
    <AdminShell title="Dashboard">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="rounded-xl border border-border/60 bg-card p-5 hover:border-primary/60 transition">
            <s.icon className="h-5 w-5 text-primary" />
            <div className="mt-3 text-3xl font-bold">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
