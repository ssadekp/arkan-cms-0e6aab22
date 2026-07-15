import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Settings, FileText, Target, FolderKanban, Users, Newspaper, LogOut, ArrowLeft, Tag, Info, Mail, Languages, FileArchive, ListTree, MessageSquare, Home, Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminListAll } from "@/lib/admin.functions";
import { ThemeInjector } from "@/components/site/ThemeInjector";
import { useI18n } from "@/lib/i18n";

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const fn = useServerFn(adminListAll);
  const { data } = useQuery({ queryKey: ["admin-all"], queryFn: () => fn(), staleTime: 60_000 });
  const { lang, setLang, t, dir } = useI18n();

  const i18nRows = (data?.settingsI18n as any[]) ?? [];
  const currentRow = i18nRows.find((x) => x.lang === lang) ?? {};
  const fallbackRow = i18nRows.find((x) => x.lang === (lang === "ar" ? "en" : "ar")) ?? {};
  const sidebarName =
    currentRow.admin_sidebar_name ||
    fallbackRow.admin_sidebar_name ||
    currentRow.site_name ||
    fallbackRow.site_name ||
    "CMS";

  const topItems = [
    { to: "/admin", label: t("admin.dashboard"), icon: LayoutDashboard, exact: true },
    { to: "/admin/settings", label: t("admin.settings"), icon: Settings },
    { to: "/admin/branding", label: lang === "ar" ? "الهوية البصرية" : "Branding", icon: Palette },
  ];
  const pagesItems = [
    { to: "/admin/homepage", label: lang === "ar" ? "الصفحة الرئيسية" : "Homepage", icon: Home },
    { to: "/admin/pages", label: t("admin.pages"), icon: FileText },
    { to: "/admin/menu", label: lang === "ar" ? "القائمة الرئيسية" : "Main Menu", icon: ListTree },
    { to: "/admin/about", label: t("admin.aboutUs"), icon: Info },
    { to: "/admin/contact", label: t("admin.contactUs"), icon: Mail },
    { to: "/admin/forms", label: lang === "ar" ? "نماذج التواصل" : "Contact Forms", icon: MessageSquare },
  ];

  const contentItems = [
    { to: "/admin/focus-areas", label: t("admin.focus"), icon: Target },
    { to: "/admin/projects", label: t("admin.projects"), icon: FolderKanban },
    { to: "/admin/tags", label: t("admin.tags"), icon: Tag },
    { to: "/admin/partners", label: t("admin.partners"), icon: Users },
    { to: "/admin/news", label: t("admin.news"), icon: Newspaper },
    { to: "/admin/documents", label: t("admin.documents"), icon: FileArchive },
  ];
  const managementItems = [
    { to: "/admin/users", label: t("admin.users"), icon: Users },
  ];


  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const renderItems = (items: { to: string; label: string; icon: any; exact?: boolean }[]) =>
    items.map((it) => {
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
    });

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background" dir={dir}>
        <Sidebar collapsible="icon" side={dir === "rtl" ? "right" : "left"}>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{sidebarName}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(topItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t("admin.group.pages")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(pagesItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t("admin.group.content")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(contentItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>{t("admin.group.management")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>{renderItems(managementItems)}</SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/"><ArrowLeft className="h-4 w-4" /><span>{t("admin.viewSite")}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={signOut}>
                      <LogOut className="h-4 w-4" /><span>{t("nav.signout")}</span>
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
            <div className="ms-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                aria-label="Toggle language"
              >
                <Languages className="h-4 w-4" />
                <span className="ms-1">{lang === "ar" ? "English" : "العربية"}</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
