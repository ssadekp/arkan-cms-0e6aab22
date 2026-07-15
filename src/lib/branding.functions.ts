import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertAdmin(userId: string) {
  const sb = await admin();
  const { data } = await sb.from("user_roles").select("role").eq("user_id", userId).in("role", ["admin", "super_admin"]);
  if (!data || data.length === 0) throw new Error("Forbidden");
}

export const getThemeTokens = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const { data } = await sb.from("theme_tokens" as any).select("*").eq("id", 1).maybeSingle();
  return (data as any) ?? null;
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #00A651");

const themeSchema = z.object({
  primary_hex: hex,
  ink_hex: hex,
  background_hex: hex,
  foreground_hex: hex,
  surface_hex: hex,
  accent_hex: hex,
  destructive_hex: hex,
  border_hex: hex,
  radius_rem: z.number().min(0).max(3),
  font_display: z.string().min(1).max(60),
  font_body: z.string().min(1).max(60),
  font_arabic: z.string().min(1).max(60),
});

export const saveThemeTokens = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => themeSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sb = await admin();
    await sb.from("theme_tokens" as any).upsert({ id: 1, ...data });
    return { ok: true };
  });
