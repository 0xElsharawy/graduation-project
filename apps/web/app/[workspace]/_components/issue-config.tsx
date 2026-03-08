"use client";

import {
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleOff,
  Clock,
  SignalHigh as HighPriorityIcon,
  SignalLow as LowPriorityIcon,
  SignalMedium as MediumPriorityIcon,
  Ellipsis as NoPriorityIcon,
  OctagonAlert as UrgentPriorityIcon,
} from "lucide-react";
import { attempt } from "@/lib/error-handling";
import { getUser } from "@/lib/user";

export const statusConfig = [
  {
    value: "backlog",
    label: "Backlog",
    icon: <CircleDashed className="text-[#f2994a]" size={14} />,
  },
  {
    value: "planned",
    label: "Planned",
    icon: <Circle className="text-[#d7d8db]" size={14} />,
  },
  {
    value: "in_progress",
    label: "In Progress",
    icon: <Clock className="text-[#f0bf00]" size={14} />,
  },
  {
    value: "completed",
    label: "Completed",
    icon: <CheckCircle2 className="text-[#5e6ad2]" size={14} />,
  },
  {
    value: "cancelled",
    label: "Cancelled",
    icon: <CircleOff className="text-[#8a8f98]" size={14} />,
  },
] as const;

export type StatusValue = (typeof statusConfig)[number]["value"];

export const priorityConfig = [
  {
    value: 0,
    label: "No priority",
    icon: <NoPriorityIcon className="text-muted-foreground" size={14} />,
  },
  {
    value: 1,
    label: "Low",
    icon: <LowPriorityIcon className="text-sky-500" size={14} />,
  },
  {
    value: 2,
    label: "Medium",
    icon: <MediumPriorityIcon className="text-yellow-500" size={14} />,
  },
  {
    value: 3,
    label: "High",
    icon: <HighPriorityIcon className="text-orange-500" size={14} />,
  },
  {
    value: 4,
    label: "Urgent",
    icon: <UrgentPriorityIcon className="text-red-500" size={14} />,
  },
];

export function formatDueDate(date?: Date): string | null {
  if (!date) {
    return null;
  }
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function getUsernameInitials(id?: string): Promise<string> {
  if (!id) {
    return "?";
  }
  const [result, error] = await attempt(getUser(id));
  if (error || !result) {
    return "?";
  }
  return result.data.user.name?.slice(0, 2).toUpperCase() ?? "?";
}
