"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleOff,
  Clock,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { attempt } from "@/lib/error-handling";
import { deleteProject, listProjects, type Project } from "@/lib/projects";
import {
  findWorkspaceBySlug,
  getWorkspaceMembers,
  type WorkspaceMember,
} from "@/lib/workspace";
import { CreateProjectDialog } from "./_components/create-project-dialog";

const STATUS_CONFIG = {
  backlog: {
    label: "Backlog",
    icon: CircleDashed,
    className: "border-border text-muted-foreground",
    dotClass: "bg-muted-foreground",
  },
  planned: {
    label: "Planned",
    icon: Circle,
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className:
      "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
    dotClass: "bg-green-500",
  },
  cancelled: {
    label: "Cancelled",
    icon: CircleOff,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    dotClass: "bg-destructive",
  },
} as const;

const PRIORITY_CONFIG: Record<number, { label: string; className: string }> = {
  0: { label: "No Priority", className: "border-border text-muted-foreground" },
  1: {
    label: "Low",
    className: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  2: {
    label: "Medium",
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  3: {
    label: "High",
    className:
      "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400",
  },
  4: {
    label: "Urgent",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

const STATUS_FILTERS = [
  "all",
  "backlog",
  "planned",
  "in_progress",
  "completed",
  "cancelled",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function StatCard({
  label,
  count,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`group flex flex-col gap-3 border p-4 text-left transition-colors hover:bg-accent ${active ? "border-primary bg-accent/40" : "border-border bg-card"}`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs uppercase tracking-wider">
          {label}
        </span>
        <Icon
          className={`size-4 ${active ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>
      <span
        className={`font-semibold text-2xl tabular-nums ${active ? "text-primary" : ""}`}
      >
        {count}
      </span>
    </button>
  );
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return (email[0] ?? "?").toUpperCase();
  }
  return "?";
}

function ProjectCardFooter({
  start,
  end,
  lead,
}: {
  start: string | null;
  end: string | null;
  lead?: WorkspaceMember;
}) {
  if (start === null && end === null && !lead) {
    return null;
  }
  return (
    <CardFooter className="flex items-center justify-between gap-1.5 text-muted-foreground text-xs">
      <div className="flex items-center gap-1.5">
        {start !== null ? (
          <>
            <CalendarDays className="size-3 shrink-0" />
            <span>{start}</span>
          </>
        ) : null}
        {start !== null && end !== null ? <span>→</span> : null}
        {end !== null ? <span>{end}</span> : null}
      </div>
      {lead ? (
        <div className="flex items-center gap-1.5">
          <Avatar className="size-5 shrink-0">
            <AvatarImage alt={lead.name ?? ""} src={lead.image ?? undefined} />
            <AvatarFallback className="font-medium text-[9px]">
              {getInitials(lead.name, lead.email)}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[100px] truncate">
            {lead.name ?? lead.email}
          </span>
        </div>
      ) : null}
    </CardFooter>
  );
}

function ProjectCard({
  project,
  href,
  onDelete,
  lead,
}: {
  project: Project;
  href: string;
  onDelete: (project: Project) => void;
  lead?: WorkspaceMember;
}) {
  const status = STATUS_CONFIG[project.status];
  const priority = PRIORITY_CONFIG[project.priority] ?? PRIORITY_CONFIG[0];
  const StatusIcon = status.icon;

  const formatDate = (d: Date | null | undefined) =>
    d
      ? new Date(d).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  const start = formatDate(project.startDate);
  const end = formatDate(project.endDate);

  return (
    <Link href={`${href}/${project.id}/overview`}>
      <Card className="group/card flex h-full cursor-pointer flex-col transition-colors hover:bg-accent/40">
        <CardHeader className="mb-0 pb-0">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-1 font-semibold text-sm">
              {project.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="size-6 opacity-0 transition-opacity group-hover/card:opacity-100"
                    onClick={(e) => e.preventDefault()}
                    size="icon"
                    variant="ghost"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    data-variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(project);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-end gap-3">
          <div className="flex flex-wrap gap-1.5">
            <span
              className={`inline-flex items-center gap-1 border px-2 py-0.5 text-xs ${status.className}`}
            >
              <StatusIcon className="size-3" />
              {status.label}
            </span>
            {project.priority > 0 ? (
              <span
                className={`inline-flex items-center border px-2 py-0.5 text-xs ${priority?.className ?? ""}`}
              >
                {priority?.label}
              </span>
            ) : null}
          </div>
        </CardContent>

        <ProjectCardFooter end={end} lead={lead} start={start} />
      </Card>
    </Link>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 border border-dashed py-20 text-center">
      <div className="flex size-12 items-center justify-center border bg-muted">
        <FolderOpen className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-sm">No projects yet</p>
        <p className="mt-1 text-muted-foreground text-xs">
          Create your first project to start tracking work.
        </p>
      </div>
      <Button onClick={onNew} size="sm" variant="outline">
        <Plus className="size-3.5" />
        New Project
      </Button>
    </div>
  );
}

export default function ProjectsPage() {
  const params = useParams();
  const pathname = usePathname();
  const slug = decodeURIComponent(params.workspace as string);
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const { data: workspaceData, isLoading: isWorkspaceLoading } = useQuery({
    queryKey: ["workspace", slug],
    queryFn: async () => {
      const [result, error] = await attempt(findWorkspaceBySlug(slug));
      if (error || !result) {
        toast.error("Error while fetching workspace");
        throw new Error("Failed to fetch workspace");
      }
      return result.data.workspace;
    },
  });

  const { data: projectsData, isLoading: isProjectsLoading } = useQuery({
    queryKey: ["projects", workspaceData?.id],
    queryFn: async () => {
      const [projectsResult, projectsError] = await attempt(
        listProjects(workspaceData?.id ?? "")
      );
      if (projectsError || !projectsResult) {
        toast.error("Error while fetching projects");
        throw new Error("Failed to fetch projects");
      }
      return projectsResult.data.projects;
    },
    enabled: !!workspaceData?.id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["workspace-members", workspaceData?.id],
    queryFn: async () => {
      const [result, error] = await attempt(
        getWorkspaceMembers(workspaceData?.id ?? "")
      );
      if (error || !result) {
        return [];
      }
      return result.data.members;
    },
    enabled: !!workspaceData?.id,
  });

  const { mutate: handleDelete, isPending: isDeleting } = useMutation({
    mutationFn: (projectId: string) =>
      deleteProject(workspaceData?.id ?? "", projectId),
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({
        queryKey: ["projects", workspaceData?.id],
      });
      setProjectToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete project");
      setProjectToDelete(null);
    },
  });

  if (isProjectsLoading || isWorkspaceLoading) {
    return <Loading />;
  }

  if (!workspaceData) {
    return null;
  }

  const projects = projectsData ?? [];

  const counts = {
    all: projects.length,
    backlog: projects.filter((p) => p.status === "backlog").length,
    planned: projects.filter((p) => p.status === "planned").length,
    in_progress: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
    cancelled: projects.filter((p) => p.status === "cancelled").length,
  };

  const filtered =
    statusFilter === "all"
      ? projects
      : projects.filter((p) => p.status === statusFilter);

  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Projects</h1>
          <p className="mt-0.5 text-muted-foreground text-sm">
            {projects.length === 0
              ? "No projects in this workspace yet"
              : `${projects.length} project${projects.length !== 1 ? "s" : ""} in this workspace`}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          New Project
        </Button>
      </div>

      {projects.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-6">
            <StatCard
              active={statusFilter === "all"}
              count={counts.all}
              icon={FolderOpen}
              label="All"
              onClick={() => setStatusFilter("all")}
            />
            <StatCard
              active={statusFilter === "backlog"}
              count={counts.backlog}
              icon={CircleDashed}
              label="Backlog"
              onClick={() => setStatusFilter("backlog")}
            />
            <StatCard
              active={statusFilter === "planned"}
              count={counts.planned}
              icon={Circle}
              label="Planned"
              onClick={() => setStatusFilter("planned")}
            />
            <StatCard
              active={statusFilter === "in_progress"}
              count={counts.in_progress}
              icon={Clock}
              label="In Progress"
              onClick={() => setStatusFilter("in_progress")}
            />
            <StatCard
              active={statusFilter === "completed"}
              count={counts.completed}
              icon={CheckCircle2}
              label="Completed"
              onClick={() => setStatusFilter("completed")}
            />
            <StatCard
              active={statusFilter === "cancelled"}
              count={counts.cancelled}
              icon={CircleOff}
              label="Cancelled"
              onClick={() => setStatusFilter("cancelled")}
            />
          </div>

          <Separator />
        </>
      )}

      {statusFilter !== "all" && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">
            Showing{" "}
            <span className="font-medium text-foreground">
              {STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label}
            </span>{" "}
            projects
          </span>
          <button
            className="text-muted-foreground text-xs underline underline-offset-2 hover:text-foreground"
            onClick={() => setStatusFilter("all")}
            type="button"
          >
            Clear
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState onNew={() => setDialogOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              href={pathname}
              key={project.id}
              lead={members.find((m) => m.userId === project.leadId)}
              onDelete={setProjectToDelete}
              project={project}
            />
          ))}
        </div>
      )}

      <CreateProjectDialog
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        workspace={workspaceData}
      />

      <AlertDialog
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        open={!!projectToDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {projectToDelete?.name}
              </span>
              ? This action cannot be undone and will permanently remove the
              project and all its issues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => {
                if (projectToDelete) {
                  handleDelete(projectToDelete.id);
                }
              }}
              variant={"destructive"}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
