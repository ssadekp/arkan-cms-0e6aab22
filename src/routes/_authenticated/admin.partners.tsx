import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/partners")({
  component: () => (
    <AdminShell title="Partners">
      <ResourceManager
        table="partners"
        title="Partners"
        hasI18n={false}
        rootFields={[
          { key: "name", label: "Name" },
          { key: "logo_url", label: "Logo URL" },
          { key: "website_url", label: "Website URL" },
          { key: "show_on_home", label: "Show on home", type: "boolean" },
          { key: "sort_order", label: "Sort order", type: "number" },
        ]}
        i18nFields={[]}
        listLabel={(row) => row.name}
      />
    </AdminShell>
  ),
});
