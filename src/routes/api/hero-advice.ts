import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/hero-advice")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleHeroAdvice } = await import("@/lib/hero-ai/adviser.server");
    return handleHeroAdvice(request);
  } } },
});