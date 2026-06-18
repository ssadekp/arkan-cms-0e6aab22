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

/* ---------- PUBLIC ---------- */

export const getForm = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: form } = await sb.from("contact_forms" as any)
      .select("*").eq("slug", data.slug).eq("published", true).maybeSingle();
    if (!form) return null;
    const { data: fields } = await sb.from("contact_form_fields" as any)
      .select("*").eq("form_id", (form as any).id).order("position");
    return { form, fields: (fields as any[]) ?? [] };
  });

export const submitForm = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({
    form_id: z.string().uuid(),
    data: z.record(z.string(), z.any()),
    files: z.array(z.object({
      field_key: z.string(),
      path: z.string(),
      name: z.string(),
      url: z.string().optional(),
    })).default([]),
    user_agent: z.string().max(500).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const sb = await admin();
    // ensure form is published
    const { data: form } = await sb.from("contact_forms" as any)
      .select("id, published").eq("id", data.form_id).maybeSingle();
    if (!form || !(form as any).published) throw new Error("Form unavailable");
    const { error } = await (sb.from("contact_form_submissions" as any) as any).insert({
      form_id: data.form_id,
      data: data.data,
      files: data.files,
      user_agent: data.user_agent ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- ADMIN ---------- */

export const adminListForms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const [forms, counts] = await Promise.all([
      sb.from("contact_forms" as any).select("*").order("created_at", { ascending: false }),
      sb.from("contact_form_submissions" as any).select("form_id"),
    ]);
    const tally: Record<string, number> = {};
    ((counts.data as any[]) ?? []).forEach((s) => {
      tally[s.form_id] = (tally[s.form_id] ?? 0) + 1;
    });
    return {
      forms: ((forms.data as any[]) ?? []).map((f) => ({ ...f, submission_count: tally[f.id] ?? 0 })),
    };
  });

export const adminGetForm = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const [form, fields] = await Promise.all([
      sb.from("contact_forms" as any).select("*").eq("id", data.id).maybeSingle(),
      sb.from("contact_form_fields" as any).select("*").eq("form_id", data.id).order("position"),
    ]);
    return { form: form.data, fields: (fields.data as any[]) ?? [] };
  });

const formSchema = z.object({
  id: z.string().uuid().nullable(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "lowercase letters, numbers, and dashes only"),
  title_en: z.string(),
  title_ar: z.string(),
  description_en: z.string(),
  description_ar: z.string(),
  success_message_en: z.string(),
  success_message_ar: z.string(),
  notify_email: z.string().email().nullable().optional(),
  published: z.boolean(),
});

export const saveForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => formSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const tbl = sb.from("contact_forms" as any) as any;
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await tbl.update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { id: _i, ...insert } = data;
    const { data: ins, error } = await tbl.insert(insert).select("id").single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const deleteForm = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const { error } = await (sb.from("contact_forms" as any) as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const fieldSchema = z.object({
  id: z.string().uuid().nullable(),
  form_id: z.string().uuid(),
  position: z.number().int(),
  field_key: z.string().min(1).regex(/^[a-z0-9_]+$/, "lowercase letters, numbers, underscores only"),
  field_type: z.enum(["text", "email", "phone", "textarea", "select", "radio", "checkbox", "file", "date", "number"]),
  label_en: z.string(),
  label_ar: z.string(),
  placeholder_en: z.string(),
  placeholder_ar: z.string(),
  required: z.boolean(),
  options_json: z.array(z.object({ value: z.string(), label_en: z.string(), label_ar: z.string() })),
});

export const saveField = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => fieldSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const tbl = sb.from("contact_form_fields" as any) as any;
    const payload = { ...data, options_json: data.options_json as any };
    if (data.id) {
      const { id, ...rest } = payload;
      const { error } = await tbl.update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { id: _i, ...insert } = payload;
    const { data: ins, error } = await tbl.insert(insert).select("id").single();
    if (error) throw new Error(error.message);
    return { id: ins.id };
  });

export const deleteField = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const { error } = await (sb.from("contact_form_fields" as any) as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { form_id: string }) => z.object({ form_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const [form, fields, subs] = await Promise.all([
      sb.from("contact_forms" as any).select("*").eq("id", data.form_id).maybeSingle(),
      sb.from("contact_form_fields" as any).select("*").eq("form_id", data.form_id).order("position"),
      sb.from("contact_form_submissions" as any).select("*").eq("form_id", data.form_id).order("created_at", { ascending: false }),
    ]);
    return {
      form: form.data,
      fields: (fields.data as any[]) ?? [],
      submissions: (subs.data as any[]) ?? [],
    };
  });

export const deleteSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertStaff(context.userId);
    const sb = await admin();
    const { error } = await (sb.from("contact_form_submissions" as any) as any).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
