import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAll } from "@/lib/admin.functions";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/projects")({
  component: Projects,
});

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  planned:   { ar: "مخطط",  en: "Planned" },
  ongoing:   { ar: "جارٍ",   en: "Ongoing" },
  completed: { ar: "مكتمل", en: "Completed" },
};

function Projects() {
  const fn = useServerFn(adminListAll);
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn() });
  const { lang } = useI18n();

  const focusOptions = (data?.focus ?? []).map((f) => {
    const ar = (data!.focusI18n).find((x: any) => x.focus_area_id === f.id && x.lang === "ar")?.title ?? f.slug;
    return { value: f.id, label: ar };
  });

  const statusOptions = Object.entries(STATUS_LABELS).map(([value, l]) => ({
    value, label: `${l.ar} / ${l.en}`,
  }));

  return (
    <AdminShell title="Projects">
      <ResourceManager
        table="projects"
        title="Projects"
        rootFields={[
          { key: "slug", label: "Slug" },
          { key: "hero_image", label: "Hero image URL" },
          { key: "gallery", label: "Gallery", type: "gallery" },
          { key: "focus_area_id", label: "Focus area", type: "select", options: focusOptions },
          { key: "status", label: "Status", type: "enum", options: statusOptions },
          { key: "tags", label: "Tags", type: "tags" },
          { key: "partners", label: "Partners", type: "partners" },

          { key: "sort_order", label: "Sort order", type: "number" },
          { key: "published", label: "Published", type: "boolean" },
        ]}
        i18nFields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "rich" },
        ]}
        listLabel={(row, i18n) => {
          const title = i18n.find((x: any) => x.project_id === row.id && x.lang === lang)?.title
            ?? i18n.find((x: any) => x.project_id === row.id && x.lang === "ar")?.title
            ?? row.slug;
          const status = STATUS_LABELS[row.status]?.[lang] ?? row.status;
          return `${title} — ${status}`;
        }}
      />
    </AdminShell>
  );
}
