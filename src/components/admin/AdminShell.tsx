import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Settings, FileText, Target, FolderKanban, Users, Newspaper, BarChart3, LogOut, ArrowLeft, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/settings", label: "Settings", icon: Settings },
  { to: "/admin/pages", label: "Pages", icon: FileText },
  { to: "/admin/focus-areas", label: "Focus Areas", icon: Target },
  { to: "/admin/projects", label: "Projects", icon: FolderKanban },
  { to: "/admin/tags", label: "Tags", icon: Tag },
  { to: "/admin/partners", label: "Partners", icon: Users },
  { to: "/admin/news", label: "News", icon: Newspaper },
  { to: "/admin/stats", label: "Homepage Stats", icon: BarChart3 },
];

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <Sidebar collapsible="icon">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Lam7et Khair CMS</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((it) => {
                    const active = it.exact ? path === it.to : path.startsWith(it.to);
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
                  })}
                </SidebarMenu>
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
