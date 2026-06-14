"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconAlertTriangle, IconInfoCircle, IconLock, IconWorld } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { updateChannel } from "@/lib/chat";
import { cn } from "@/lib/utils";

type ChangeVisibilityDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  channelId: string;
  channelName: string;
  currentVisibility: "public" | "private";
};

const schema = z.object({
  visibility: z.enum(["public", "private"]),
});

type VisibilityFormValues = z.infer<typeof schema>;

export function ChangeVisibilityDialog({
  workspaceId,
  channelId,
  channelName,
  currentVisibility,
  onOpenChange,
  open,
}: ChangeVisibilityDialogProps) {
  const router = useRouter();
  const resolver = useMemo(() => zodResolver(schema), []);
  const queryClient = useQueryClient();

  const form = useForm<VisibilityFormValues>({
    resolver,
    mode: "onChange",
    defaultValues: {
      visibility: currentVisibility,
    },
  });

  // Keep form values in sync if dialog is opened with a different current visibility
  useEffect(() => {
    if (open) {
      form.setValue("visibility", currentVisibility);
    }
  }, [open, currentVisibility, form]);

  const selectedVisibility = form.watch("visibility");
  const isDirty = selectedVisibility !== currentVisibility;

  const updateVisibilityMutation = useMutation({
    mutationFn: (dto: { visibility: "public" | "private" }) =>
      updateChannel(workspaceId, channelId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatThreads", workspaceId] });
      toast.success(`Channel visibility updated to ${selectedVisibility}`);
      onOpenChange(false);
    },
    onError: (error: AxiosError<{ message: string }>) => {
      if (
        error.message?.includes("Session expired") ||
        error.message?.includes("Unauthorized")
      ) {
        router.push("/login");
        return;
      }
      form.setError("root", {
        message: error.response?.data?.message ?? "Failed to update channel visibility",
      });
    },
  });

  function onSubmit(values: VisibilityFormValues) {
    updateVisibilityMutation.mutate({
      visibility: values.visibility,
    });
  }

  function handleCancel() {
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="gap-0 overflow-hidden border-border p-0 sm:max-w-md!">
        {/* Header — monospace, sharp, industrial */}
        <DialogHeader className="border-border border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              MUTATE
            </span>
            <span className="font-mono text-muted-foreground/40 text-xs">
              ·
            </span>
            <DialogTitle className="font-bold font-mono text-sm uppercase tracking-widest">
              Visibility
            </DialogTitle>
          </div>
          <DialogDescription className="font-mono text-[11px] text-muted-foreground/70 uppercase tracking-tight mt-1">
            Editing settings for channel <span className="text-foreground">#{channelName}</span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-5 px-6 py-5">
              {/* Visibility Selector — Segmented Buttons */}
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Select Visibility Mode
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          {
                            value: "public",
                            label: "Public",
                            description: "Open to all workspace users",
                            Icon: IconWorld,
                          },
                          {
                            value: "private",
                            label: "Private",
                            description: "Restricted workspace access",
                            Icon: IconLock,
                          },
                        ] as const
                      ).map(({ value, label, description, Icon }) => {
                        const active = field.value === value;
                        return (
                          <button
                            className={cn(
                              "flex flex-col gap-1 border p-3 text-left transition-colors relative overflow-hidden",
                              active
                                ? "border-foreground bg-foreground/5 text-foreground"
                                : "border-input text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                            )}
                            key={value}
                            onClick={() => field.onChange(value)}
                            type="button"
                          >
                            <span className="flex items-center gap-1.5 font-mono font-semibold text-xs uppercase tracking-wider">
                              <Icon size={12} strokeWidth={2.5} />
                              {label}
                            </span>
                            <span className="font-mono text-[10px] leading-snug opacity-70">
                              {description}
                            </span>
                            {/* Accent marker for the current actual visibility */}
                            {currentVisibility === value && (
                              <span className="absolute right-2 top-2 font-mono text-[8px] bg-muted-foreground/10 px-1 text-muted-foreground uppercase">
                                Current
                              </span>
                            )}
                            {/* Active indicator bar */}
                            <span
                              className={cn(
                                "mt-2 h-px w-full transition-colors",
                                active ? "bg-foreground" : "bg-transparent"
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </FormItem>
                )}
              />

              {/* Monospace Rule Ledger */}
              <div className="border border-border bg-muted/40 p-4 font-mono text-[11px] leading-relaxed">
                <p className="font-bold text-foreground/80 uppercase border-b border-border pb-1.5 mb-2 tracking-wider flex items-center gap-1.5">
                  {selectedVisibility === "private" ? (
                    <>
                      <IconAlertTriangle className="text-amber-500 shrink-0" size={14} />
                      CAUTION: MUTATION IMPACT
                    </>
                  ) : (
                    <>
                      <IconInfoCircle className="text-foreground shrink-0" size={14} />
                      INFO: MUTATION IMPACT
                    </>
                  )}
                </p>
                {selectedVisibility === "private" ? (
                  <div className="space-y-1.5 text-muted-foreground">
                    <p>
                      • Access will be revoked for all members who are not explicitly added.
                    </p>
                    <p>
                      • This channel will be hidden from searches and list screens.
                    </p>
                    <p>
                      • Message history will remain intact, but inaccessible to non-invited users.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-muted-foreground">
                    <p>
                      • Any member of the workspace will be allowed to view and join this channel.
                    </p>
                    <p>
                      • The channel will appear in the workspace directory/sidebar for everyone.
                    </p>
                    <p>
                      • Message history will be visible to all workspace members.
                    </p>
                  </div>
                )}
              </div>

              {/* Root-level API error */}
              {form.formState.errors.root && (
                <p className="font-mono text-[10px] text-destructive">
                  {form.formState.errors.root.message}
                </p>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="border-border border-t px-6 py-4">
              <Button
                className="rounded-none font-mono text-xs uppercase tracking-widest"
                onClick={handleCancel}
                type="button"
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                className="rounded-none font-mono text-xs uppercase tracking-widest"
                disabled={
                  updateVisibilityMutation.isPending || 
                  !isDirty
                }
                type="submit"
              >
                {updateVisibilityMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    MUTATING…
                  </span>
                ) : (
                  "APPLY CHANGES"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
