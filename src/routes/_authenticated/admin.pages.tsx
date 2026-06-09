import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  component: () => (
    <AdminShell title="Pages">
      <ResourceManager
        table="pages"
        title="Pages"
        rootFields={[
          { key: "slug", label: "Slug" },
          { key: "hero_image", label: "Hero image URL" },
          { key: "show_in_nav", label: "Show in main nav", type: "boolean" },
          { key: "nav_order", label: "Nav order", type: "number" },
          { key: "published", label: "Published", type: "boolean" },
        ]}
        i18nFields={[
          { key: "title", label: "Title" },
          { key: "body", label: "Body", type: "textarea" },
          { key: "seo_title", label: "SEO title" },
          { key: "seo_description", label: "SEO description", type: "textarea" },
        ]}
        listLabel={(row, i18n) => i18n.find((x) => x.page_id === row.id && x.lang === "ar")?.title ?? row.slug}
      />
    </AdminShell>
  ),
});
