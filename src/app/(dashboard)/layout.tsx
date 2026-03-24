import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <SidebarProvider>
      <AppSidebar farmName={user.farmName} />
      <SidebarInset>
        <TopBar
          user={{
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          }}
        />
        <main className="flex-1 overflow-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
