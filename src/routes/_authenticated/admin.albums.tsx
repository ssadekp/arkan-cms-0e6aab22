import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/albums")({
  component: () => (
    <AdminShell title="Photo Albums">
      <ResourceManager
        table="albums"
        title="Albums"
        rootFields={[
          { key: "slug", label: "Slug" },
          { key: "cover_image", label: "Album cover image", type: "image" },
          { key: "gallery", label: "Photos", type: "gallery" },
          { key: "published", label: "Published", type: "boolean" },
        ]}
        i18nFields={[
          { key: "title", label: "Album name" },
          { key: "description", label: "Short description", type: "textarea" },
        ]}
        listLabel={(row, i18n) => i18n.find((x: any) => x.album_id === row.id && x.lang === "ar")?.title ?? row.slug}
      />
    </AdminShell>
  ),
});
