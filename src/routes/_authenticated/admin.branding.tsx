import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getThemeTokens, saveThemeTokens } from "@/lib/branding.functions";
import { themeQueryKey } from "@/components/site/ThemeInjector";

const DEFAULTS = {
  primary_hex: "#00A651",
  ink_hex: "#0B0F14",
  background_hex: "#FDFDFB",
  foreground_hex: "#12161C",
  surface_hex: "#F7F7F4",
  accent_hex: "#E6F7EE",
  destructive_hex: "#DC2626",
  border_hex: "#E5E7EB",
  radius_rem: 1,
  font_display: "Manrope",
  font_body: "Manrope",
  font_arabic: "Tajawal",
};

const COLOR_FIELDS: Array<{ key: keyof typeof DEFAULTS; label: string; hint?: string }> = [
  { key: "primary_hex", label: "Primary / Brand", hint: "Main accent color (buttons, links)" },
  { key: "ink_hex", label: "Ink (dark secondary)", hint: "Footer, high-contrast buttons" },
  { key: "background_hex", label: "Background", hint: "Page background" },
  { key: "foreground_hex", label: "Foreground (text)", hint: "Default body text" },
  { key: "surface_hex", label: "Surface / Muted", hint: "Cards, muted areas" },
  { key: "accent_hex", label: "Accent (soft)", hint: "Highlighted chips, badges" },
  { key: "destructive_hex", label: "Destructive", hint: "Delete / error" },
  { key: "border_hex", label: "Border", hint: "Dividers, inputs" },
];

function BrandingForm() {
  const getFn = useServerFn(getThemeTokens);
  const saveFn = useServerFn(saveThemeTokens);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: themeQueryKey, queryFn: () => getFn(), staleTime: 60_000 });

  const [form, setForm] = useState(DEFAULTS);

  useEffect(() => {
    if (data) {
      setForm({
        primary_hex: data.primary_hex ?? DEFAULTS.primary_hex,
        ink_hex: data.ink_hex ?? DEFAULTS.ink_hex,
        background_hex: data.background_hex ?? DEFAULTS.background_hex,
        foreground_hex: data.foreground_hex ?? DEFAULTS.foreground_hex,
        surface_hex: data.surface_hex ?? DEFAULTS.surface_hex,
        accent_hex: data.accent_hex ?? DEFAULTS.accent_hex,
        destructive_hex: data.destructive_hex ?? DEFAULTS.destructive_hex,
        border_hex: data.border_hex ?? DEFAULTS.border_hex,
        radius_rem: Number(data.radius_rem ?? DEFAULTS.radius_rem),
        font_display: data.font_display ?? DEFAULTS.font_display,
        font_body: data.font_body ?? DEFAULTS.font_body,
        font_arabic: data.font_arabic ?? DEFAULTS.font_arabic,
      });
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: (v: typeof DEFAULTS) => saveFn({ data: v }),
    onSuccess: () => {
      toast.success("Branding saved");
      qc.invalidateQueries({ queryKey: themeQueryKey });
    },
    onError: (e: any) => toast.error(e?.message ?? "Save failed"),
  });

  const set = <K extends keyof typeof DEFAULTS>(k: K, v: (typeof DEFAULTS)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader><CardTitle>Colors</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {COLOR_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form[f.key] as string}
                  onChange={(e) => set(f.key, e.target.value as any)}
                  className="h-10 w-14 rounded border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={form[f.key] as string}
                  onChange={(e) => set(f.key, e.target.value as any)}
                  placeholder="#000000"
                  className="font-mono"
                />
              </div>
              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Radius</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label>Corner radius (rem): {form.radius_rem}</Label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.125}
            value={form.radius_rem}
            onChange={(e) => set("radius_rem", Number(e.target.value))}
            className="w-full"
          />
          <div className="flex gap-3 pt-2">
            <div className="h-12 w-24 bg-primary" style={{ borderRadius: `${form.radius_rem}rem` }} />
            <div className="h-12 w-24 border-2 border-primary" style={{ borderRadius: `${form.radius_rem}rem` }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fonts</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Display (headings)</Label>
            <Input value={form.font_display} onChange={(e) => set("font_display", e.target.value)} />
            <p className="text-xs text-muted-foreground">Google Font name, e.g. Manrope</p>
          </div>
          <div className="space-y-1.5">
            <Label>Body (Latin)</Label>
            <Input value={form.font_body} onChange={(e) => set("font_body", e.target.value)} />
            <p className="text-xs text-muted-foreground">e.g. Inter, Manrope</p>
          </div>
          <div className="space-y-1.5">
            <Label>Arabic</Label>
            <Input value={form.font_arabic} onChange={(e) => set("font_arabic", e.target.value)} />
            <p className="text-xs text-muted-foreground">e.g. Tajawal, Cairo, IBM Plex Sans Arabic</p>
          </div>
          <div className="sm:col-span-3 rounded-md border border-border p-4 space-y-1" style={{ fontFamily: `"${form.font_display}", sans-serif` }}>
            <p className="text-2xl font-bold">The quick brown fox — Sample heading</p>
            <p className="text-base" style={{ fontFamily: `"${form.font_body}", sans-serif` }}>
              This is body text set in {form.font_body}.
            </p>
            <p className="text-base" dir="rtl" style={{ fontFamily: `"${form.font_arabic}", sans-serif` }}>
              نص عربي تجريبي بخط {form.font_arabic}.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => mut.mutate(form)} disabled={mut.isPending}>
          {mut.isPending ? "Saving…" : "Save branding"}
        </Button>
        <Button variant="outline" onClick={() => setForm(DEFAULTS)} disabled={mut.isPending}>
          Reset to defaults
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Changes apply everywhere on your site. You may need to refresh other tabs.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/admin/branding")({
  component: () => (
    <AdminShell title="Branding">
      <BrandingForm />
    </AdminShell>
  ),
});
