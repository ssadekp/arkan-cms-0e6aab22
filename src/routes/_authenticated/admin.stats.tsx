import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { ResourceManager } from "@/components/admin/ResourceManager";

export const Route = createFileRoute("/_authenticated/admin/stats")({
  component: () => (
    <AdminShell title="Homepage Stats">
      <ResourceManager
        table="homepage_stats"
        title="Homepage Stats"
        rootFields={[
          { key: "icon", label: "Icon name (lucide)" },
          { key: "value", label: "Value (e.g. 1,200+)" },
          { key: "sort_order", label: "Sort order", type: "number" },
          { key: "active", label: "Active", type: "boolean" },
        ]}
        i18nFields={[
          { key: "label", label: "Label" },
        ]}
        listLabel={(row, i18n) => `${row.value} — ${i18n.find((x) => x.stat_id === row.id && x.lang === "ar")?.label ?? ""}`}
      />
    </AdminShell>
  ),
});
