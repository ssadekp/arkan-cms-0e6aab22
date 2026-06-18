## 1. Homepage section visibility toggles

Add boolean columns to `site_settings`:
- `show_focus_areas`, `show_projects`, `show_news`, `show_documents`, `show_partners`, `show_stats` (default true)
- `show_all_sections` master toggle (default true)

In **admin Settings**, add a "Homepage sections" card with switches (AR & EN labels).
In `src/routes/index.tsx`, read `site` settings and conditionally render each section (AND with master toggle).

## 2. Menu builder (replaces auto nav)

New table `menu_items`:
- `id`, `parent_id` (nullable, self-FK, 1 level only — enforced in UI), `position` int, `label_en`, `label_ar`, `url` text (internal path or external), `target` ("_self"|"_blank"), `published` bool

New admin page `/admin/menu`:
- Drag-to-reorder list (use existing UI primitives, simple up/down buttons to keep it small)
- "Add submenu item" only available on top-level rows
- CRUD via existing admin function pattern

`src/components/site/Header.tsx` fetches menu via a new public server fn `getMenu()` and renders top-level items; items with children render as a dropdown (use existing `NavigationMenu` shadcn component). Falls back to current static nav if no items configured.

## 3. Custom contact forms

Tables:
- `contact_forms`: `id`, `slug` (unique), `title_en`, `title_ar`, `description_en`, `description_ar`, `success_message_en`, `success_message_ar`, `notify_email`, `published`
- `contact_form_fields`: `id`, `form_id`, `position`, `field_key`, `field_type` (text|email|phone|textarea|select|radio|checkbox|file|date|number), `label_en`, `label_ar`, `placeholder_en`, `placeholder_ar`, `required` bool, `options_json` (for select/radio/checkbox)
- `contact_form_submissions`: `id`, `form_id`, `data jsonb`, `files jsonb` (array of {field_key, path, name}), `created_at`, `ip` text, `user_agent` text

RLS:
- forms/fields: public SELECT where `published=true`; admin write
- submissions: admin SELECT/DELETE only; public INSERT into published forms (validated via server fn)

File uploads use existing `site-media` bucket under `contact-uploads/{form_id}/{submission_id}/`.

Public route `/forms/$slug` renders the form dynamically. Replaces nothing — existing `/contact` page stays.

Admin pages:
- `/admin/forms` — list/create/edit forms + field builder
- `/admin/forms/$id/submissions` — table view + "Export to Excel" button (uses `xlsx` lib client-side, downloads `.xlsx`)

## 4. Files

**New migrations** (one combined):
- alter `site_settings` for visibility flags
- create `menu_items`, `contact_forms`, `contact_form_fields`, `contact_form_submissions` with GRANTs + RLS

**New code:**
- `src/lib/menu.functions.ts` (public `getMenu`, admin CRUD)
- `src/lib/forms.functions.ts` (public `getForm`, `submitForm`; admin list/CRUD/list-submissions/delete-submission)
- `src/routes/_authenticated/admin.menu.tsx`
- `src/routes/_authenticated/admin.forms.tsx`
- `src/routes/_authenticated/admin.forms.$id.tsx` (field builder)
- `src/routes/_authenticated/admin.forms.$id.submissions.tsx` (+ Excel export)
- `src/routes/forms.$slug.tsx`
- update `src/routes/index.tsx`, `src/components/site/Header.tsx`, `src/routes/_authenticated/admin.settings.tsx`, `src/components/admin/AdminShell.tsx` (sidebar entries), `src/lib/admin.functions.ts` (extend settings schema)
- `bun add xlsx` for Excel export

## Notes
- Submenus capped at 1 level as you chose
- Forms support all field types you selected (text/email/phone/textarea, select/radio/checkbox, file, date/number)
- Master "hide all sections" toggle leaves only the hero on the homepage
- Excel export is client-side; works for any submission count up to tens of thousands