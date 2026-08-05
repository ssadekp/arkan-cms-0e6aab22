import { Link } from "@tanstack/react-router";

export function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

type Item = { key: string; label: string; image?: string | null; meta?: string | null };

export function SidebarList({
  items,
  to,
  paramKey = "slug",
}: {
  items: Item[];
  to: string;
  paramKey?: string;
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.key}>
          <Link
            to={to as any}
            params={{ [paramKey]: it.key } as any}
            className="group flex items-center gap-3 rounded-xl p-2 -m-2 transition hover:bg-muted/60"
          >
            {it.image !== undefined && (
              <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {it.image && <img src={it.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium group-hover:text-primary">{it.label}</span>
              {it.meta && <span className="block text-xs text-muted-foreground">{it.meta}</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
