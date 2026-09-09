import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAll, getMyRoles } from "@/lib/admin.functions";
import { adminListDonations } from "@/lib/support.functions";
import { useI18n } from "@/lib/i18n";
import { isAdminPathHidden } from "@/lib/modules";
import { Button } from "@/components/ui/button";
import {
  FileText, Target, FolderKanban, Users, Newspaper, ShieldCheck, Images, Video,
  HeartHandshake, Info, Plus, ArrowUpRight, EyeOff, Eye, Sparkles, Settings, Home,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminHome,
});

const money = (n: number, currency: string) =>
  `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} ${currency}`;

function AdminHome() {
  const fn = useServerFn(adminListAll);
  const rolesFn = useServerFn(getMyRoles);
  const donationsFn = useServerFn(adminListDonations);
  const { lang, t } = useI18n();
  const ar = lang === "ar";

  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn() });
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });

  const settings = (data as any)?.settings ?? {};
  const hidden = (settings.hidden_modules ?? []) as string[];
  const donationsEnabled = settings.donation_enabled !== false && !isAdminPathHidden(hidden, "/admin/donations");

  const { data: donationData } = useQuery({
    queryKey: ["admin-donations-summary"],
    queryFn: () => donationsFn(),
    enabled: donationsEnabled,
  });

  if (roles && roles.length === 0) {
    return (
      <AdminShell title={t("admin.dashboard")}>
        <div className="max-w-md rounded-xl border border-border/60 bg-card p-6">
          <ShieldCheck className="h-6 w-6 text-primary mb-3" />
          <h2 className="font-semibold">{ar ? "لا توجد صلاحية" : "No staff role assigned"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {ar
              ? "حسابك لا يملك صلاحية الإدارة أو التحرير. اطلب من أحد المديرين منحك صلاحية."
              : "Your account doesn't have admin or editor access. Ask an existing admin to grant you a role."}
          </p>
        </div>
      </AdminShell>
    );
  }

  const i18nRows = (data?.settingsI18n as any[]) ?? [];
  const row = i18nRows.find((x) => x.lang === lang) ?? i18nRows[0] ?? {};
  const siteName = row.site_name || row.site_title || "CMS";

  const cards = [
    { key: "/admin/pages", label: ar ? "الصفحات" : "Pages", rows: data?.pages, icon: FileText },
    { key: "/admin/focus-areas", label: ar ? "مجالات العمل" : "Focus Areas", rows: data?.focus, icon: Target },
    { key: "/admin/projects", label: ar ? "المشروعات" : "Projects", rows: data?.projects, icon: FolderKanban },
    { key: "/admin/news", label: ar ? "الأخبار" : "News", rows: data?.news, icon: Newspaper },
    { key: "/admin/articles", label: ar ? "المقالات" : "Articles", rows: (data as any)?.articles, icon: Newspaper },
    { key: "/admin/albums", label: ar ? "ألبومات الصور" : "Photo Albums", rows: (data as any)?.albums, icon: Images },
    { key: "/admin/video-albums", label: ar ? "ألبومات الفيديو" : "Video Albums", rows: (data as any)?.videoAlbums, icon: Video },
    { key: "/admin/partners", label: ar ? "الجمعيات والمؤسسات" : "Partners", rows: data?.partners, icon: Users },
    { key: "/admin/about", label: ar ? "فريق العمل" : "Team", rows: (data as any)?.team_members, icon: Info },
  ]
    .filter((c) => !isAdminPathHidden(hidden, c.key))
    .map((c) => {
      const list = (c.rows as any[]) ?? [];
      const published = list.filter((r) => r.published !== false).length;
      return { ...c, total: list.length, published, drafts: list.length - published };
    });

  const donations = ((donationData as any)?.donations ?? []) as any[];
  const currency = settings.donation_currency || "EGP";
  const pledged = donations
    .filter((d) => d.status !== "cancelled")
    .reduce((s, d) => s + Number(d.amount || 0), 0);
  const received = donations
    .filter((d) => d.status === "received")
    .reduce((s, d) => s + Number(d.amount || 0), 0);
  const newCount = donations.filter((d) => d.status === "new").length;

  const drafts = cards.filter((c) => c.drafts > 0);

  const checklist = [
    { ok: !!settings.logo_url, label: ar ? "شعار الموقع" : "Site logo", to: "/admin/branding" },
    { ok: !!settings.favicon_url, label: ar ? "أيقونة المتصفح" : "Browser icon", to: "/admin/branding" },
    { ok: !!settings.contact_email, label: ar ? "بريد التواصل" : "Contact email", to: "/admin/contact" },
    { ok: !!(row.seo_description && row.seo_title), label: ar ? "وصف الموقع لمحركات البحث" : "SEO title & description", to: "/admin/settings" },
    { ok: ((settings.hero_slides ?? []) as any[]).length > 0 || !!settings.hero_image, label: ar ? "صور البانر الرئيسي" : "Homepage banner images", to: "/admin/homepage" },
  ];
  const missing = checklist.filter((c) => !c.ok);

  const quick = [
    { to: "/admin/news", label: ar ? "خبر جديد" : "New post", icon: Newspaper },
    { to: "/admin/projects", label: ar ? "مشروع جديد" : "New project", icon: FolderKanban },
    { to: "/admin/albums", label: ar ? "ألبوم جديد" : "New album", icon: Images },
    { to: "/admin/homepage", label: ar ? "الصفحة الرئيسية" : "Homepage", icon: Home },
    { to: "/admin/settings", label: ar ? "الإعدادات" : "Settings", icon: Settings },
  ].filter((q) => !isAdminPathHidden(hidden, q.to));

  return (
    <AdminShell title={t("admin.dashboard")}>
      <div className="space-y-6">
        {/* Hero strip */}
        <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                {ar ? "لوحة التحكم" : "Control panel"}
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight">{siteName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {ar
                  ? "نظرة سريعة على المحتوى والتبرعات وحالة الموقع."
                  : "A quick overview of your content, donations and site health."}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                {ar ? "عرض الموقع" : "View site"}
                <ArrowUpRight className="h-4 w-4 ms-1" />
              </Link>
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {quick.map((q) => (
              <Button key={q.to} asChild size="sm" variant="secondary">
                <Link to={q.to}>
                  <Plus className="h-3.5 w-3.5 me-1" />
                  <q.icon className="h-3.5 w-3.5 me-1" />
                  {q.label}
                </Link>
              </Button>
            ))}
          </div>
        </section>

        {/* Donations summary */}
        {donationsEnabled && (
          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { label: ar ? "إجمالي التبرعات المتعهد بها" : "Total pledged", value: money(pledged, currency) },
              { label: ar ? "تم استلامه" : "Received", value: money(received, currency) },
              { label: ar ? "طلبات جديدة" : "New requests", value: String(newCount) },
            ].map((s) => (
              <Link
                key={s.label}
                to="/admin/donations"
                className="rounded-xl border border-border/60 bg-card p-5 transition hover:border-primary/60"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HeartHandshake className="h-4 w-4 text-primary" />
                  {s.label}
                </div>
                <div className="mt-2 text-2xl font-bold">{s.value}</div>
              </Link>
            ))}
          </section>
        )}

        {/* Content stats */}
        <section>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            {ar ? "المحتوى" : "Content"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((c) => (
              <Link
                key={c.key}
                to={c.key}
                className="group rounded-xl border border-border/60 bg-card p-5 transition hover:border-primary/60 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-primary/10 p-2 text-primary">
                    <c.icon className="h-4 w-4" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                </div>
                <div className="mt-3 text-3xl font-bold leading-none">{c.total}</div>
                <div className="mt-1 text-sm font-medium">{c.label}</div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {c.published} {ar ? "منشور" : "live"}
                  </span>
                  {c.drafts > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-500">
                      <EyeOff className="h-3 w-3" /> {c.drafts} {ar ? "مسودة" : "draft"}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Health + drafts */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <h3 className="text-sm font-semibold">{ar ? "جاهزية الموقع" : "Site readiness"}</h3>
            {missing.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {ar ? "كل الأساسيات مكتملة. عمل رائع!" : "All the basics are set. Nice work!"}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {missing.map((m) => (
                  <li key={m.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{m.label}</span>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={m.to}>{ar ? "إضافة" : "Add"}</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-5">
            <h3 className="text-sm font-semibold">{ar ? "بانتظار النشر" : "Waiting to be published"}</h3>
            {drafts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {ar ? "لا توجد مسودات غير منشورة." : "No unpublished drafts."}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {drafts.map((d) => (
                  <li key={d.key} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{d.label}</span>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={d.key}>
                        {d.drafts} {ar ? "مسودة" : "draft"}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
