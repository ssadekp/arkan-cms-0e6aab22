import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Settings, FileText, Target, FolderKanban, Users, Newspaper, BarChart3, LogOut, ArrowLeft, Tag, Info, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminListAll } from "@/lib/admin.functions";

const topItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const pagesItems = [
  { to: "/admin/pages", label: "Pages", icon: FileText },
  { to: "/admin/about", label: "About Us", icon: Info },
  { to: "/admin/contact", label: "Contact Us", icon: Mail },
];

const contentItems = [
  { to: "/admin/focus-areas", label: "Focus Areas", icon: Target },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/tags", label: "Tags", icon: Tag },
  { to: "/admin/partners", label: "Partners", icon: Users },
  { to: "/admin/news", label: "News", icon: Newspaper },
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const fn = useServerFn(adminListAll);
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn(), staleTime: 60_000 });

  const i18nRows = (data?.settingsI18n as any[]) ?? [];
  const siteName =
    i18nRows.find((x) => x.lang === "ar")?.site_name ||
    i18nRows.find((x) => x.lang === "en")?.site_name ||
    "CMS";

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const renderItems = (items: typeof topItems) =>
    items.map((it) => {
      const active = (it as any).exact ? path === it.to : path.startsWith(it.to);
      return (
        <SidebarMenuItem key={it.to}>
          <SidebarMenuButton asChild isActive={active}>
            <Link to={it.to}>
              <it.icon className="h-4 w-4" />
              <span>{it.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{siteName}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(topItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Pages</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(pagesItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Content</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(contentItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/"><ArrowLeft className="h-4 w-4" /><span>View site</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={signOut}>
                      <LogOut className="h-4 w-4" /><span>Sign out</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/60 flex items-center px-4 gap-3">
            <SidebarTrigger />
            <h1 className="text-base font-semibold">{title}</h1>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
