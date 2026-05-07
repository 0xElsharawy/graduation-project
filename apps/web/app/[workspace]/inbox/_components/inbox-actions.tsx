"use client";

import { CheckCheck, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type InboxActionsProps = {
  unreadCount: number;
  readCount: number;
  isPending: boolean;
  onMarkAllRead: () => void;
  onClearRead: () => void;
};

export function InboxActions({
  unreadCount,
  readCount,
  isPending,
  onMarkAllRead,
  onClearRead,
}: InboxActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button
        className="h-7 gap-1.5 px-2.5 font-medium text-[11px] text-muted-foreground hover:text-foreground"
        disabled={isPending || unreadCount === 0}
        onClick={onMarkAllRead}
        size="sm"
        type="button"
        variant="ghost"
      >
        <CheckCheck className="size-3.5" />
        Mark all read
      </Button>

      <div className="h-3.5 w-px bg-border/70" />

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            className="h-7 gap-1.5 px-2.5 font-medium text-[11px] text-muted-foreground hover:text-destructive"
            disabled={isPending || readCount === 0}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-3.5" />
            Clear read
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear read notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes every notification you have already read in this
              workspace. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onClearRead} variant="destructive">
              Clear read
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
