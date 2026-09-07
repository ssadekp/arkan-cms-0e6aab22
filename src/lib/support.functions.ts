import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function assertStaff(userId: string) {
  const sb = await admin();
  const { data } = await sb.from("user_roles").select("role").eq("user_id", userId)
    .in("role", ["super_admin", "admin", "editor"]);
  if (!data || data.length === 0) throw new Error("Forbidden");
}

/* ---------- PUBLIC: FAQ ---------- */

export const getFaqs = createServerFn({ method: "GET" }).handler(async () => {
  const sb = await admin();
  const [faqs, faqsI18n] = await Promise.all([
    (sb.from("faqs" as any) as any).select("*").eq("published", true).order("sort_order"),
    (sb.from("faqs_i18n" as any) as any).select("*"),
  ]);
  return { faqs: (faqs.data as any[]) ?? [], faqsI18n: (faqsI18n.data as any[]) ?? [] };
});

/* ---------- PUBLIC: DONATIONS ---------- */

export const submitDonation = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(6).max(30).regex(/^[0-9+\-()\s]+$/, "Invalid phone number"),
    email: z.string().trim().email().max(255).optional().or(z.literal("")),
    amount: z.number().positive().max(10_000_000),
    note: z.string().trim().max(1000).optional(),
    user_agent: z.string().max(500).optional(),
    hp: z.string().max(200).optional(),
    started_at: z.number().int().optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    // Spam guards: honeypot + minimum fill time.
    if (data.hp && data.hp.trim() !== "") return { ok: true };
    if (data.started_at && Date.now() - data.started_at < 2000) return { ok: true };

    const sb = await admin();

    const { data: settings } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
    if (settings && (settings as any).donation_enabled === false) {
      throw new Error("Donations are currently unavailable");
    }
    const currency = ((settings as any)?.donation_currency as string) || "EGP";

    // Rate limit: max 5 pledges per browser signature in 10 minutes.
    if (data.user_agent) {
      const sinceIso = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { count } = await (sb.from("donations" as any) as any)
        .select("id", { count: "exact", head: true })
        .eq("user_agent", data.user_agent)
        .gte("created_at", sinceIso);
      if ((count ?? 0) >= 5) throw new Error("Too many submissions. Please try again later.");
    }

    const { error } = await (sb.from("donations" as any) as any).insert({
      name: data.name,
      phone: data.phone,
      email: data.email ? data.email : null,
      amount: data.amount,
      currency,
      note: data.note ?? null,
      user_agent: data.user_agent ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- ADMIN: FAQ ---------- */

export const adminListFaqs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const [faqs, faqsI18n] = await Promise.all([
      (sb.from("faqs" as any) as any).select("*").order("sort_order"),
      (sb.from("faqs_i18n" as any) as any).select("*"),
    ]);
    return { faqs: (faqs.data as any[]) ?? [], faqsI18n: (faqsI18n.data as any[]) ?? [] };
  });

const faqSchema = z.object({
  id: z.string().uuid().nullable(),
  sort_order: z.number().int(),
  published: z.boolean(),
  i18n: z.array(z.object({
    lang: z.enum(["ar", "en"]),
    question: z.string().max(300),
    answer: z.string().max(5000),
  })),
});

export const saveFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => faqSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const tbl = sb.from("faqs" as any) as any;
    let id = data.id;
    if (id) {
      const { error } = await tbl.update({ sort_order: data.sort_order, published: data.published }).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { data: ins, error } = await tbl
        .insert({ sort_order: data.sort_order, published: data.published }).select("id").single();
      if (error) throw new Error(error.message);
      id = ins.id as string;
    }
    for (const row of data.i18n) {
      const { error } = await (sb.from("faqs_i18n" as any) as any).upsert({ faq_id: id, ...row });
      if (error) throw new Error(error.message);
    }
    return { id };
  });

export const deleteFaq = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const { error } = await (sb.from("faqs" as any) as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderFaqs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    items: z.array(z.object({ id: z.string().uuid(), sort_order: z.number().int() })).max(500),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    for (const it of data.items) {
      await (sb.from("faqs" as any) as any).update({ sort_order: it.sort_order }).eq("id", it.id);
    }
    return { ok: true };
  });

/* ---------- ADMIN: DONATIONS ---------- */

export const adminListDonations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const { data } = await (sb.from("donations" as any) as any)
      .select("*").order("created_at", { ascending: false }).limit(2000);
    return { donations: (data as any[]) ?? [] };
  });

export const updateDonationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    id: z.string().uuid(),
    status: z.enum(["new", "contacted", "received", "cancelled"]),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const { error } = await (sb.from("donations" as any) as any)
      .update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDonation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const { error } = await (sb.from("donations" as any) as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
