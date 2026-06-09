"use client";

import { SquareChartGantt, SquaresExclude } from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function WorkspaceLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { project, workspace: slug } = useParams();
  const workspaceSlug = decodeURIComponent(slug as string);

  const navigateTo = (target: "overview" | "issues") => {
    router.replace(`/${workspaceSlug}/projects/${project}/${target}`);
  };

  const isProjectRoute = project && pathname?.includes("/projects");
  const isSettingsRoute = pathname?.includes("/settings") ?? false;

  return (
    <SidebarProvider>
      {!isSettingsRoute && <AppSidebar />}
      <div className="flex h-full flex-1 md:overflow-hidden md:w-[calc(100%-var(--sidebar-width))] flex-col">
        {!isSettingsRoute && (
          <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator className="h-full bg-border" orientation="vertical" />
              {isProjectRoute ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => navigateTo("overview")}
                    size={"sm"}
                    variant="outline"
                  >
                    <SquareChartGantt />
                    Overview
                  </Button>
                  <Button
                    onClick={() => navigateTo("issues")}
                    size={"sm"}
                    variant="outline"
                  >
                    <SquaresExclude />
                    Issues
                  </Button>
                </div>
              ) : null}
            </div>
            <ModeToggle />
          </header>
        )}
        {children}
      </div>
    </SidebarProvider>
  );
}
