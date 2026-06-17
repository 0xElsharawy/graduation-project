"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconHash, IconLock, IconWorld } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { createChannel } from "@/lib/chat";
import { cn } from "@/lib/utils";

type CreateChannelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
};

const schema = z.object({
  name: z
    .string()
    .min(2, "Channel name must be at least 2 characters")
    .max(80, "Channel name must be under 80 characters")
    .regex(
      /^[a-z0-9_-]+$/,
      "Only lowercase letters, numbers, hyphens, and underscores"
    ),
  visibility: z.enum(["public", "private"]),
});

type ChannelFormValues = z.infer<typeof schema>;

export function CreateChannelDialog({
  workspaceId,
  onOpenChange,
  open,
}: CreateChannelDialogProps) {
  const router = useRouter();
  const resolver = useMemo(() => zodResolver(schema), []);
  const queryClient = useQueryClient();

  const form = useForm<ChannelFormValues>({
    resolver,
    mode: "onChange",
    defaultValues: {
      name: "",
      visibility: "public",
    },
  });

  const { isValid } = form.formState;

  const createChannelMutation = useMutation({
    mutationFn: (dto: { name: string; visibility: "public" | "private" }) =>
      createChannel(workspaceId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatThreads", workspaceId] });
      toast.success("Channel created");
      form.reset();
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
        message: error.response?.data?.message ?? "Failed to create channel",
      });
    },
  });

  function onSubmit(values: ChannelFormValues) {
    createChannelMutation.mutate({
      name: values.name,
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
        {/* Header — sharp, monospace, industrial */}
        <DialogHeader className="border-border border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              NEW
            </span>
            <span className="font-mono text-muted-foreground/40 text-xs">
              ·
            </span>
            <DialogTitle className="font-bold font-mono text-sm uppercase tracking-widest">
              Channel
            </DialogTitle>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-5 px-6 py-5">
              {/* Channel name input with fused # sigil */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormControl>
                      <div
                        className={cn(
                          "flex items-center border border-input bg-background transition-colors focus-within:border-foreground/60",
                          form.formState.errors.name && "border-destructive"
                        )}
                      >
                        {/* # sigil — the visual anchor */}
                        <span className="flex h-10 w-10 shrink-0 select-none items-center justify-center border-input border-r bg-muted font-mono text-muted-foreground">
                          <IconHash size={16} strokeWidth={2.5} />
                        </span>
                        <input
                          autoComplete="off"
                          autoFocus
                          className="h-10 flex-1 bg-transparent px-3 font-mono text-sm outline-none placeholder:text-muted-foreground/50"
                          placeholder="e.g. design-reviews"
                          {...field}
                          // Enforce lowercase-slug in real time
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                .toLowerCase()
                                .replace(/\s+/g, "-")
                                .replace(/[^a-z0-9_-]/g, "")
                            )
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="font-mono text-[10px]" />
                  </FormItem>
                )}
              />

              {/* Visibility — inline pill-chip toggle, no dropdown */}
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Visibility
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          {
                            value: "public",
                            label: "Public",
                            description: "Anyone in the workspace",
                            Icon: IconWorld,
                          },
                          {
                            value: "private",
                            label: "Private",
                            description: "Only invited members",
                            Icon: IconLock,
                          },
                        ] as const
                      ).map(({ value, label, description, Icon }) => {
                        const active = field.value === value;
                        return (
                          <button
                            className={cn(
                              "flex flex-col gap-1 border p-3 text-left transition-colors",
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
                            {/* Active indicator bar */}
                            <span
                              className={cn(
                                "mt-1 h-px w-full transition-colors",
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
                disabled={createChannelMutation.isPending || !isValid}
                type="submit"
              >
                {createChannelMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating…
                  </span>
                ) : (
                  "Create Channel"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
