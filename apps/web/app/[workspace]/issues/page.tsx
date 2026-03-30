"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, LayoutDashboard, LayoutList } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { attempt } from "@/lib/error-handling";
import { findWorkspaceBySlug, getAllTasks } from "@/lib/workspace";
import IssuesCalendar from "../_components/issues-calendar";
import IssuesKanban from "../_components/issues-kanban";
import IssuesTable from "../_components/issues-table";

type View = "list" | "board" | "calendar";

export default function IssuesPage() {
  const [view, setView] = useState<View>("list");
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = decodeURIComponent(params.workspace as string);
  const router = useRouter();

  const { data: workspaceData, isLoading: isWorkspaceLoading } = useQuery({
    queryKey: ["workspace", slug],
    enabled: !!slug,
    queryFn: async () => {
      const [result, error] = await attempt(findWorkspaceBySlug(slug));
      if (error || !result) {
        toast.error("Error while fetching workspace");
        throw new Error("Failed to fetch workspace");
      }
      return result.data.workspace;
    },
  });

  const { data: allTasksData, isLoading: isAllTasksLoading } = useQuery({
    queryKey: ["all-tasks", workspaceData?.id],
    enabled: !!workspaceData?.id,
    queryFn: async () => {
      const [result, error] = await attempt(
        getAllTasks(workspaceData?.id ?? "")
      );
      if (error || !result) {
        toast.error("Error while fetching all tasks");
        throw new Error("Failed to fetch all tasks");
      }
      return result.data.tasks;
    },
  });

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (
      viewParam === "list" ||
      viewParam === "board" ||
      viewParam === "calendar"
    ) {
      setView(viewParam as View);
    }
  }, [searchParams]);

  if (isWorkspaceLoading || isAllTasksLoading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="flex items-center gap-1 border-border border-b px-2 py-1.5">
        <Button
          onClick={() => {
            setView("list");
            router.replace(`/${slug}/issues?view=list`);
          }}
          size="icon"
          title="List view"
          variant={view === "list" ? "secondary" : "ghost"}
        >
          <LayoutList size={16} />
        </Button>
        <Button
          onClick={() => {
            setView("board");
            router.replace(`/${slug}/issues?view=board`);
          }}
          size="icon"
          title="Board view"
          variant={view === "board" ? "secondary" : "ghost"}
        >
          <LayoutDashboard size={16} />
        </Button>
        <Button
          onClick={() => {
            setView("calendar");
            router.replace(`/${slug}/issues?view=calendar`);
          }}
          size="icon"
          title="Calendar view"
          variant={view === "calendar" ? "secondary" : "ghost"}
        >
          <CalendarDays size={16} />
        </Button>
      </div>

      {view === "list" && <IssuesTable projectTasksData={allTasksData} />}
      {view === "board" && <IssuesKanban projectTaskData={allTasksData} />}
      {view === "calendar" && <IssuesCalendar projectTaskData={allTasksData} />}
    </div>
  );
}
