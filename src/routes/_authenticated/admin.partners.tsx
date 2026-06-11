import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/partners")({
  component: () => (
    <AdminShell title="Partners">
      <ResourceManager
        table="partners"
        title="Partners"
        rootFields={[
          { key: "name", label: "Internal name (fallback)" },
          { key: "logo_url", label: "Logo URL" },
          { key: "website_url", label: "Website URL" },
          { key: "show_on_home", label: "Show on home", type: "boolean" },
          { key: "sort_order", label: "Sort order", type: "number" },
        ]}
        i18nFields={[
          { key: "name", label: "Display name" },
        ]}
        listLabel={(row, i18n) => {
          const ar = i18n.find((x: any) => x.partner_id === row.id && x.lang === "ar")?.name;
          return ar || row.name;
        }}
      />
    </AdminShell>
  ),
});
