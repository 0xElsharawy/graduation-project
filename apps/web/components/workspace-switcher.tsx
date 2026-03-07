"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ExternalLink, Plus, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { attempt } from "@/lib/error-handling";
import { findWorkspaceBySlug, listWorkspaces } from "@/lib/workspace";
import { CreateTaskDialog } from "../app/[workspace]/projects/_components/create-task-dialog";

export function WorkspaceSwitcher() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const router = useRouter();
  const params = useParams();
  const slug = decodeURIComponent(params.workspace as string);
  const { isMobile } = useSidebar();
  const { data: workspaces } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const [result, error] = await attempt(listWorkspaces(1, 2));
      if (error || !result) {
        toast.error("Error while fetching workspaces");
        return;
      }
      if (result.data.workspaces.length > 0) {
        return result.data;
      }
      router.push("/workspaces/new");
      return { workspaces: [], total: 0 };
    },
    enabled: !!slug,
  });

  const { data: _workspace, isLoading: isWorkspaceLoading } = useQuery({
    queryKey: ["workspace", slug],
    queryFn: async () => {
      const [result, error] = await attempt(findWorkspaceBySlug(slug));
      if (error || !result) {
        toast.error("Error while fetching workspace");
        return;
      }
      return result?.data.workspace;
    },
    enabled: !!slug,
  });

  if (isWorkspaceLoading || !_workspace) {
    return null;
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                size="lg"
              >
                <div className="flex aspect-square size-6 items-center justify-center rounded-sm bg-primary text-white">
                  <span className="font-semibold text-xs">
                    {_workspace?.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {_workspace?.name}
                  </span>
                </div>
                <ChevronDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Workspaces
              </DropdownMenuLabel>
              {workspaces?.workspaces?.slice(0, 2).map((workspace) => (
                <DropdownMenuItem
                  className="gap-2 p-2"
                  key={workspace.name}
                  onClick={() => {
                    router.push(`/${encodeURIComponent(workspace.slug)}`);
                  }}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border text-muted-foreground text-xs">
                    {workspace.name.slice(0, 2).toUpperCase()}
                  </div>
                  {workspace.name}
                </DropdownMenuItem>
              ))}
              {(workspaces?.total ?? 0) > 2 && (
                <DropdownMenuItem asChild>
                  <Link className="text-muted-foreground" href="/workspaces">
                    See more
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2">
                <Link
                  className="flex items-center gap-2"
                  href={`/${encodeURIComponent(_workspace.slug ?? "")}/settings/members`}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Users className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Invite and add members
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2 p-2">
                <Link
                  className="flex items-center gap-2"
                  href={`/${encodeURIComponent(_workspace?.slug ?? "")}/settings/preferences`}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Settings className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Settings
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="gap-2 p-2">
                <Link
                  className="flex items-center gap-2"
                  href="/workspaces/new"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Add workspace
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="h-8 w-8"
            onClick={() => setDialogOpen(true)}
            size="icon"
            variant="outline"
          >
            <ExternalLink className="size-4" />
            <span className="sr-only">Create new issue</span>
          </Button>
        </SidebarMenuItem>
      </SidebarMenu>
      <CreateTaskDialog
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        workspace={_workspace}
      />
    </>
  );
}
