import { format } from "date-fns";
import type { InboxNotification } from "@/lib/inbox";

const statusLabels: Record<string, string> = {
  backlog: "Backlog",
  planned: "Planned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const priorityLabels: Record<number, string> = {
  0: "No priority",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Urgent",
};

function text(value: unknown, fallback = "Unknown") {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function dateLabel(value: unknown) {
  if (typeof value !== "string") {
    return "No due date";
  }

  return format(new Date(value), "MMM d, yyyy");
}

function priorityLabel(value: unknown) {
  return typeof value === "number" ? priorityLabels[value] : undefined;
}

function statusLabel(value: unknown) {
  return typeof value === "string" ? statusLabels[value] : undefined;
}

export function getNotificationTitle(notification: InboxNotification) {
  const actor = notification.actor?.name ?? "Someone";
  const metadata = notification.metadata ?? {};
  const taskName = notification.task?.name ?? text(metadata.taskName, "a task");
  const projectName =
    notification.project?.name ?? text(metadata.projectName, "a project");

  switch (notification.type) {
    case "task_assigned":
      return `${actor} assigned you ${taskName}`;
    case "task_unassigned":
      return `${actor} unassigned you from ${taskName}`;
    case "task_status_changed":
      return `${actor} changed ${taskName} from ${
        statusLabel(metadata.fromStatus) ?? text(metadata.fromStatus)
      } to ${statusLabel(metadata.toStatus) ?? text(metadata.toStatus)}`;
    case "task_priority_changed":
      return `${actor} changed ${taskName} priority from ${
        priorityLabel(metadata.fromPriority) ?? text(metadata.fromPriority)
      } to ${priorityLabel(metadata.toPriority) ?? text(metadata.toPriority)}`;
    case "task_due_date_changed":
      return `${actor} changed ${taskName} due date from ${dateLabel(
        metadata.fromDueDate
      )} to ${dateLabel(metadata.toDueDate)}`;
    case "task_added_to_cycle":
      return `${actor} added ${taskName} to ${text(metadata.cycleName, "a cycle")}`;
    case "task_removed_from_cycle":
      return `${actor} removed ${taskName} from ${text(
        metadata.cycleName,
        "a cycle"
      )}`;
    case "project_lead_assigned":
      return `${actor} made you lead of ${projectName}`;
    case "task_comment_added": {
      const snippet = text(metadata.snippet, "");
      return snippet
        ? `${actor} commented on ${taskName}: ${snippet}`
        : `${actor} commented on ${taskName}`;
    }
    case "task_comment_mention": {
      const snippet = text(metadata.snippet, "");
      return snippet
        ? `${actor} mentioned you in ${taskName}: ${snippet}`
        : `${actor} mentioned you in ${taskName}`;
    }
    default:
      return `${actor} updated ${taskName}`;
  }
}

export function getNotificationSubject(notification: InboxNotification) {
  if (notification.task) {
    return notification.task.name;
  }

  if (notification.project) {
    return notification.project.name;
  }

  return text(
    notification.metadata.taskName,
    text(notification.metadata.projectName)
  );
}
