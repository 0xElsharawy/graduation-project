"use client";

import { SquareChartGantt, SquaresExclude } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function WorkspaceLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const navigateTo = (target: "overview" | "issues") => {
    const base = pathname?.replace(/\/(overview|issues)\/?$/, "") ?? "";
    router.replace(`${base}/${target}`);
  };

  const isProjectRoute = pathname?.includes("/projects") ?? false;
  const isSettingsRoute = pathname?.includes("/settings") ?? false;

  return (
    <SidebarProvider>
      {!isSettingsRoute && <AppSidebar />}
      <div className="flex h-full w-full flex-col">
        {!isSettingsRoute && (
          <header className="flex h-12 w-full shrink-0 items-center gap-4 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator className="h-4 bg-border" orientation="vertical" />
            {isProjectRoute ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => navigateTo("overview")}
                  variant="outline"
                >
                  <SquareChartGantt />
                  Overview
                </Button>
                <Button onClick={() => navigateTo("issues")} variant="outline">
                  <SquaresExclude />
                  Issues
                </Button>
              </div>
            ) : null}
          </header>
        )}
        {children}
      </div>
    </SidebarProvider>
  );
}
