import { describe, expect, it } from "vitest";
import { canUseHeroAdvice, heroAdviceSchema } from "./input";

describe("CMS administrator banner advice", () => {
  it("allows CMS administrators", () => expect(canUseHeroAdvice(["admin"])).toBe(true));
  it("allows super administrators", () => expect(canUseHeroAdvice(["super_admin"])).toBe(true));
  it("rejects editor access", () => expect(canUseHeroAdvice(["editor"])).toBe(false));
  it("rejects non-administrators", () => expect(canUseHeroAdvice(["user", "author"])).toBe(false));
  it("rejects signed-out roles", () => expect(canUseHeroAdvice([])).toBe(false));
  it("accepts a description without an image", () => expect(heroAdviceSchema.safeParse({ description: "Full-width charity banner", lang: "en" }).success).toBe(true));
  it("accepts a reference without a description", () => expect(heroAdviceSchema.safeParse({ image: "data:image/png;base64,aGVsbG8=", lang: "ar" }).success).toBe(true));
  it("rejects empty input", () => expect(heroAdviceSchema.safeParse({ description: " ", lang: "ar" }).success).toBe(false));
  it("rejects executable image formats", () => expect(heroAdviceSchema.safeParse({ image: "data:image/svg+xml;base64,aGVsbG8=", lang: "en" }).success).toBe(false));
  it("rejects remote image URLs", () => expect(heroAdviceSchema.safeParse({ image: "https://example.com/image.png", lang: "en" }).success).toBe(false));
});