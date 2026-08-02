import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function sbAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function anyAdminExists() {
  const sb = await sbAdmin();
  const { data } = await sb
    .from("user_roles")
    .select("user_id")
    .in("role", ["admin", "super_admin"])
    .limit(1);
  return Boolean(data && data.length > 0);
}

async function assertAdmin(userId: string) {
  const sb = await sbAdmin();
  const { data } = await sb
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"]);
  if (!data || data.length === 0) throw new Error("Forbidden");
}

/** Public: exposes only whether the instance still needs first-run setup. */
export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await sbAdmin();
  const needsSetup = !(await anyAdminExists());
  const { data: settings } = await sb
    .from("site_settings")
    .select("logo_url, favicon_url, primary_color")
    .eq("id", 1)
    .maybeSingle();
  const { data: i18n } = await sb
    .from("site_settings_i18n")
    .select("lang, site_name")
    .eq("setting_id", 1);
  return {
    needsSetup,
    hasLogo: Boolean(settings?.logo_url),
    hasFavicon: Boolean(settings?.favicon_url),
    hasSiteName: (i18n ?? []).some((r) => (r.site_name ?? "").trim().length > 0),
  };
});

/**
 * Public ONLY while the instance has no admin at all. Once the first admin
 * exists this always throws, so it cannot be used to mint extra admins.
 */
export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        email: z.string().email().max(200),
        password: z.string().min(8).max(200),
        fullName: z.string().max(120).optional().default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (await anyAdminExists()) throw new Error("Setup has already been completed.");
    const sb = await sbAdmin();
    const { data: created, error } = await sb.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.fullName ? { full_name: data.fullName } : undefined,
    });
    if (error) throw new Error(error.message);
    const userId = created.user!.id;
    for (const role of ["admin", "super_admin"] as const) {
      await sb.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
    }
    await sb.from("site_settings").upsert({ id: 1 }, { onConflict: "id", ignoreDuplicates: true });
    return { ok: true };
  });

const LANGS = ["ar", "en"] as const;

export const saveSetupIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        default_language: z.enum(LANGS),
        contact_email: z.string().max(200).optional().default(""),
        contact_phone: z.string().max(60).optional().default(""),
        i18n: z.array(
          z.object({
            lang: z.enum(LANGS),
            site_name: z.string().max(160),
            tagline: z.string().max(300),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sb = await sbAdmin();
    await sb.from("site_settings").upsert({
      id: 1,
      default_language: data.default_language,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
    });
    const { data: existing } = await sb
      .from("site_settings_i18n")
      .select("*")
      .eq("setting_id", 1);
    for (const row of data.i18n) {
      const prev = (existing ?? []).find((r) => r.lang === row.lang) as any;
      await sb.from("site_settings_i18n").upsert({
        ...(prev ?? {}),
        setting_id: 1,
        lang: row.lang,
        site_name: row.site_name,
        tagline: row.tagline,
        admin_sidebar_name: prev?.admin_sidebar_name || row.site_name,
        seo_title: prev?.seo_title || row.site_name,
        seo_description: prev?.seo_description || row.tagline,
        footer_text: prev?.footer_text ?? "",
        about_short: prev?.about_short ?? "",
        address: prev?.address ?? "",
      });
    }
    return { ok: true };
  });

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color like #00A651");

export const saveSetupBranding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        primary_hex: hex,
        logo_url: z.string().url().max(600).nullable().optional(),
        favicon_url: z.string().url().max(600).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const sb = await sbAdmin();
    await sb.from("site_settings").upsert({
      id: 1,
      logo_url: data.logo_url || null,
      favicon_url: data.favicon_url || null,
      primary_color: data.primary_hex,
    });
    const { data: tokens } = await sb
      .from("theme_tokens" as any)
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    await sb.from("theme_tokens" as any).upsert({
      ...((tokens as any) ?? {}),
      id: 1,
      primary_hex: data.primary_hex,
    });
    return { ok: true };
  });
