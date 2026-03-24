"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bug,
  Droplets,
  ClipboardList,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { title: "Ana Sayfa", href: "/", icon: LayoutDashboard },
  { title: "Hayvanlar", href: "/hayvanlar", icon: Bug },
  { title: "Süt", href: "/sut", icon: Droplets },
  { title: "Görevler", href: "/gorevler", icon: ClipboardList },
  { title: "Diğer", href: "/diger", icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    if (href === "/diger") {
      return !["/", "/hayvanlar", "/sut", "/gorevler"].some(
        (h) => pathname === h || (h !== "/" && pathname.startsWith(h + "/"))
      );
    }
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {mobileNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 text-xs transition-colors",
                active
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon
                className={cn("size-5", active && "text-primary")}
              />
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for devices with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
