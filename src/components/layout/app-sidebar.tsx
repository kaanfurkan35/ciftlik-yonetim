"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bug,
  HeartPulse,
  Baby,
  Droplets,
  Wheat,
  Wallet,
  TreePine,
  BarChart3,
  ClipboardList,
  Bell,
  Users,
  Settings,
  Tractor,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const mainNavItems = [
  { title: "Ana Sayfa", href: "/", icon: LayoutDashboard },
  { title: "Hayvanlar", href: "/hayvanlar", icon: Bug },
  { title: "Sağlık", href: "/saglik", icon: HeartPulse },
  { title: "Üreme", href: "/ureme", icon: Baby },
  { title: "Süt Üretimi", href: "/sut", icon: Droplets },
  { title: "Besleme", href: "/besleme", icon: Wheat },
  { title: "Finans", href: "/finans", icon: Wallet },
  { title: "Meralar", href: "/meralar", icon: TreePine },
];

const secondaryNavItems = [
  { title: "Raporlar", href: "/raporlar", icon: BarChart3 },
  { title: "Görevler", href: "/gorevler", icon: ClipboardList },
  { title: "Bildirimler", href: "/bildirimler", icon: Bell },
];

const systemNavItems = [
  { title: "Kullanıcılar", href: "/kullanicilar", icon: Users },
  { title: "Ayarlar", href: "/ayarlar", icon: Settings },
];

interface AppSidebarProps {
  farmName?: string;
  notificationCount?: number;
}

export function AppSidebar({
  farmName = "Çiftlik Yönetim",
  notificationCount = 0,
}: AppSidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              tooltip={farmName}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Tractor className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{farmName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  Yönetim Paneli
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Yönetim</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Takip</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {item.href === "/bildirimler" && notificationCount > 0 && (
                    <SidebarMenuBadge>{notificationCount}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
