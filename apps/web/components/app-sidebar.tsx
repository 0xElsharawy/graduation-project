"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Clock,
  Inbox,
  Plus,
  Square,
  TrendingUp,
} from "lucide-react";
import { useParams } from "next/navigation";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { authClient } from "@/lib/auth-client";
import { getInboxUnreadCount } from "@/lib/inbox";
import { findWorkspaceBySlug } from "@/lib/workspace";
import { NavUser } from "./nav-user";

function getData(slug: string, inboxUnreadCount?: number) {
  return {
    navMain: [
      {
        title: "Inbox",
        url: `/${encodeURIComponent(slug)}/inbox`,
        icon: Inbox,
        badge: inboxUnreadCount || undefined,
      },
      {
        title: "My issues",
        url: `/${encodeURIComponent(slug)}/my-issues`,
        icon: TrendingUp,
      },
      {
        title: "Create workspace",
        url: "/workspaces/new",
        icon: Plus,
      },
      {
        title: "Workspace",
        url: "#",
        icon: undefined,
        isActive: true,
        isCollapsible: true,
        items: [
          {
            title: "Projects",
            url: `/${encodeURIComponent(slug)}/projects`,
            icon: Briefcase,
          },

          {
            title: "Issues",
            url: `/${encodeURIComponent(slug)}/issues`,
            icon: Square,
            badge: 12,
          },
          {
            title: "Cycles",
            isActive: true,
            isCollapsible: false,
            url: `/${encodeURIComponent(slug)}/cycles`,
            icon: Clock,
            items: [
              {
                title: "Current",
                url: `/${encodeURIComponent(slug)}/cycles/current`,
              },
              {
                title: "Upcoming",
                url: `/${encodeURIComponent(slug)}/cycles/upcoming`,
              },
            ],
          },
        ],
      },
    ],
  };
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const slug = decodeURIComponent(params.workspace as string);
  const { data: workspace } = useQuery({
    queryKey: ["workspace", slug],
    enabled: !!slug,
    queryFn: async () => {
      const result = await findWorkspaceBySlug(slug);
      return result.data.workspace;
    },
  });
  const { data: inboxCount } = useQuery({
    queryKey: ["inbox-count", workspace?.id],
    enabled: !!workspace?.id,
    refetchInterval: 15_000,
    queryFn: async () => {
      const result = await getInboxUnreadCount(workspace?.id ?? "");
      return result.data;
    },
  });
  const { navMain } = getData(slug, inboxCount?.unread);
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  if (isSessionPending) {
    return null;
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent className="gap-2">
        <NavMain items={navMain} showLabel={false} />
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t">
        <NavUser
          user={{
            name: session?.user?.name ?? "",
            email: session?.user?.email ?? "",
            avatar: session?.user?.image ?? "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
