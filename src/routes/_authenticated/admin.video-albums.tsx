import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/video-albums")({
  component: () => (
    <AdminShell title="Video Albums">
      <ResourceManager
        table="video_albums"
        title="Video Albums"
        rootFields={[
          { key: "slug", label: "Slug" },
          { key: "cover_image", label: "Album cover image", type: "image" },
          { key: "videos", label: "Videos", type: "videos" },
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
