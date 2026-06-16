import { Facebook, Instagram, Twitter, Youtube, Linkedin, MessageCircle, Music2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SocialPlatform = "facebook" | "twitter" | "instagram" | "youtube" | "linkedin" | "tiktok" | "whatsapp";

export const SOCIAL_PLATFORMS: { value: SocialPlatform; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "X (Twitter)" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "tiktok", label: "TikTok" },
  { value: "whatsapp", label: "WhatsApp" },
];

const MAP: Record<SocialPlatform, LucideIcon> = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  tiktok: Music2,
  whatsapp: MessageCircle,
};

export function SocialIcon({ platform, className }: { platform: SocialPlatform | string; className?: string }) {
  const Icon = MAP[platform as SocialPlatform] ?? Facebook;
  return <Icon className={className} />;
}
