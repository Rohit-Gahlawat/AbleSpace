"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SessionProvider, useSession } from "@/components/session-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { user, workspace } = useSession();

  return (
    <SidebarProvider>
      <AppSidebar user={user} workspace={workspace} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
