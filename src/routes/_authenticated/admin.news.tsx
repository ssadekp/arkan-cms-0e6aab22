import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/news")({
  component: () => (
    <AdminShell title="News">
      <ResourceManager
        table="news"
        title="News"
        rootFields={[
          { key: "slug", label: "Slug" },
          { key: "hero_image", label: "Hero image URL" },
          { key: "gallery", label: "Gallery", type: "gallery" },
          { key: "published", label: "Published", type: "boolean" },
        ]}
        i18nFields={[
          { key: "title", label: "Title" },
          { key: "description", label: "Short description", type: "textarea" },
          { key: "body", label: "Body", type: "rich" },
        ]}
        listLabel={(row, i18n) => i18n.find((x: any) => x.news_id === row.id && x.lang === "ar")?.title ?? row.slug}
      />
    </AdminShell>
  ),
});
