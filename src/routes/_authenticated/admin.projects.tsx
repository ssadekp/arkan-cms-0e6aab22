import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListAll } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/projects")({
  component: Projects,
});

function Projects() {
  const fn = useServerFn(adminListAll);
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn() });
  const focusOptions = (data?.focus ?? []).map((f) => {
    const ar = (data!.focusI18n).find((x) => x.focus_area_id === f.id && x.lang === "ar")?.title ?? f.slug;
    return { value: f.id, label: ar };
  });

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
          { key: "sort_order", label: "Sort order", type: "number" },
          { key: "published", label: "Published", type: "boolean" },
        ]}
        i18nFields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        listLabel={(row, i18n) => i18n.find((x) => x.project_id === row.id && x.lang === "ar")?.title ?? row.slug}
      />
    </AdminShell>
  );
}
