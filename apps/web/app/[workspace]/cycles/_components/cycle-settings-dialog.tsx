"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarDays, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { CycleSettings } from "@/lib/cycles";
import { updateCycleSettings } from "@/lib/cycles";
import { attempt } from "@/lib/error-handling";

type CycleSettingsDialogProps = {
  workspaceId: string;
  settings?: CycleSettings;
  trigger?: React.ReactNode;
};

export function CycleSettingsDialog({
  workspaceId,
  settings,
  trigger,
}: CycleSettingsDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [lengthDays, setLengthDays] = useState(settings?.lengthDays ?? 14);
  const [startDate, setStartDate] = useState<Date | undefined>(
    settings?.startDate ? new Date(settings.startDate) : new Date()
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setEnabled(settings?.enabled ?? false);
    setLengthDays(settings?.lengthDays ?? 14);
    setStartDate(
      settings?.startDate ? new Date(settings.startDate) : new Date()
    );
  }, [open, settings]);

  const mutation = useMutation({
    mutationFn: async () => {
      const [result, error] = await attempt(
        updateCycleSettings(workspaceId, {
          enabled,
          lengthDays,
          startDate,
        })
      );
      if (error || !result) {
        throw new Error("Failed to update cycle settings");
      }
      return result.data;
    },
    onSuccess: () => {
      toast.success("Cycle settings updated");
      queryClient.invalidateQueries({
        queryKey: ["cycle-settings", workspaceId],
      });
      queryClient.invalidateQueries({ queryKey: ["cycle", workspaceId] });
      setOpen(false);
    },
    onError: () => {
      toast.error("Failed to update cycle settings");
    },
  });

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Settings2 className="size-4" />
            Cycle settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Cycle settings</DialogTitle>
          <DialogDescription>
            Enable optional workspace cycles and choose the cadence used for
            current and upcoming sprint windows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-start gap-3 rounded-md border border-border p-3">
            <Checkbox
              checked={enabled}
              id="cycles-enabled"
              onCheckedChange={(checked) => setEnabled(checked === true)}
            />
            <div className="grid gap-1">
              <Label htmlFor="cycles-enabled">Enable cycles</Label>
              <p className="text-muted-foreground text-sm">
                Teams can still leave issues unassigned; cycles are optional.
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cycle-length">Cycle length</Label>
            <div className="flex items-center gap-2">
              <Input
                className="w-28"
                id="cycle-length"
                min={1}
                onChange={(event) =>
                  setLengthDays(Math.max(1, Number(event.target.value) || 1))
                }
                type="number"
                value={lengthDays}
              />
              <span className="text-muted-foreground text-sm">days</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Cycle anchor date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button className="w-fit gap-2" type="button" variant="outline">
                  <CalendarDays className="size-4" />
                  {startDate
                    ? format(startDate, "MMM dd, yyyy")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  onSelect={setStartDate}
                  selected={startDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={mutation.isPending}
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending || lengthDays < 1}
            onClick={() => mutation.mutate()}
            type="button"
          >
            {mutation.isPending ? "Saving..." : "Save settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
