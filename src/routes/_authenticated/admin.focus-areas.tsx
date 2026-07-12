import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/focus-areas")({
  component: () => (
    <AdminShell title="Focus Areas">
      <ResourceManager
        table="focus_areas"
        title="Focus Areas"
        rootFields={[
          { key: "slug", label: "Slug" },
          { key: "icon", label: "Homepage icon (small)", type: "image" },
          { key: "hero_image", label: "Hero image", type: "image" },
          { key: "gallery", label: "Gallery", type: "gallery" },
          { key: "sort_order", label: "Sort order", type: "number" },
          { key: "published", label: "Published", type: "boolean" },
          { key: "partners", label: "Partners", type: "partners" },

        ]}
        i18nFields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Description", type: "textarea" },
        ]}
        listLabel={(row, i18n) => i18n.find((x) => x.focus_area_id === row.id && x.lang === "ar")?.title ?? row.slug}
      />
    </AdminShell>
  ),
});
