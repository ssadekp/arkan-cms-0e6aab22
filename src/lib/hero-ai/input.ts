import { z } from "zod";

export const MAX_REFERENCE_BYTES = 5 * 1024 * 1024;
export const heroAdviceSchema = z.object({
  description: z.string().trim().max(4000).default(""),
  image: z.string().max(Math.ceil(MAX_REFERENCE_BYTES / 3) * 4 + 64)
    .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/).optional(),
  lang: z.enum(["ar", "en"]),
  restoreAccess: z.boolean().optional().default(false),
}).refine((value) => value.description.length > 0 || !!value.image, {
  message: "Describe the banner or attach a reference image.",
});

export function canUseHeroAdvice(roles: string[]) {
  return roles.some((role) => role === "admin" || role === "super_admin");
}