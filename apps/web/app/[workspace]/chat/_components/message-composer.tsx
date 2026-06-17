"use client";

import { IconHash, IconPaperclip, IconSend } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ProjectTask } from "@/lib/projects";
import { cn } from "@/lib/utils";
import { getAllTasks } from "@/lib/workspace";

type MessageComposerProps = {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  workspaceId?: string;
};

export function MessageComposer({
  onSendMessage,
  disabled,
  workspaceId,
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Task mention state
  const [taskQuery, setTaskQuery] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const taskStartRef = useRef<number>(-1);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Fetch all workspace tasks for mention suggestions
  const { data: tasksData } = useQuery({
    queryKey: ["all-tasks", workspaceId],
    queryFn: async () => {
      const result = await getAllTasks(workspaceId || "");
      return result.data.tasks;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const filteredTasks = (tasksData ?? []).filter((t: ProjectTask) => {
    if (taskQuery === null) {
      return false;
    }
    if (!taskQuery) {
      return true;
    }
    return t.name.toLowerCase().includes(taskQuery.toLowerCase());
  });

  const closeTaskMenu = useCallback(() => {
    setTaskQuery(null);
    taskStartRef.current = -1;
    setHighlightedIndex(0);
  }, []);

  const insertTask = useCallback(
    (task: ProjectTask) => {
      const ta = textareaRef.current;
      if (!ta || taskStartRef.current === -1) {
        return;
      }
      const before = content.slice(0, taskStartRef.current);
      const after = content.slice(ta.selectionEnd);
      const chip = `#[${task.name}](${task.projectId}:${task.id}) `;
      const next = before + chip + after;
      setContent(next);
      closeTaskMenu();
      requestAnimationFrame(() => {
        ta.focus();
        const pos = before.length + chip.length;
        ta.setSelectionRange(pos, pos);
      });
    },
    [content, closeTaskMenu],
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    const caret = e.target.selectionEnd ?? 0;
    const textBefore = val.slice(0, caret);
    const regex = /(?:^|\s)#(\S*)$/;
    // Match # followed by non-space characters at end of typed text
    const hashMatch = regex.exec(textBefore);
    if (hashMatch && workspaceId) {
      const query = hashMatch[1] ?? "";
      setTaskQuery(query);
      setHighlightedIndex(0);

      const ta = textareaRef.current;
      if (ta) {
        const hashIdx = caret - query.length - 1;
        taskStartRef.current = hashIdx;
      }
    } else {
      closeTaskMenu();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Task mention menu navigation
    if (taskQuery !== null && filteredTasks.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % filteredTasks.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex(
          (i) => (i - 1 + filteredTasks.length) % filteredTasks.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = filteredTasks[highlightedIndex];
        if (selected) {
          insertTask(selected);
        }
        return;
      }
      if (e.key === "Escape") {
        closeTaskMenu();
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (trimmed && !disabled) {
      onSendMessage(trimmed);
      setContent("");
      closeTaskMenu();
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        closeTaskMenu();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [closeTaskMenu]);

  return (
    <div className="relative shrink-0 border-border border-t bg-background p-4">
      {/* Task mention dropdown — anchored above the composer */}
      {taskQuery !== null && filteredTasks.length > 0 && (
        <div className="absolute right-0 bottom-full left-0 z-50 mb-2 overflow-hidden rounded-md border border-border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-border border-b px-3 py-1.5">
            <IconHash className="text-primary" size={12} />
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
              Tasks
            </span>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filteredTasks.slice(0, 8).map((task: ProjectTask, idx: number) => (
              <li key={task.id}>
                <button
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 border-transparent border-l-2 px-3 py-2 text-left transition-colors",
                    idx === highlightedIndex
                      ? "border-primary bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    insertTask(task);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  type="button"
                >
                  <IconHash
                    className={cn(
                      "shrink-0",
                      idx === highlightedIndex
                        ? "text-primary"
                        : "text-muted-foreground/50",
                    )}
                    size={12}
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">
                    {task.name}
                  </span>
                  {task.status ? (
                    <span
                      className={cn(
                        "shrink-0 font-mono text-[9px] uppercase tracking-widest",
                        idx === highlightedIndex
                          ? "text-primary/70"
                          : "text-muted-foreground/40",
                      )}
                    >
                      {task.status}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-border border-t px-3 py-1.5">
            <span className="font-mono text-[9px] text-muted-foreground/50 uppercase tracking-widest">
              ↑↓ navigate · Enter select · Esc close
            </span>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2 rounded-lg border border-input bg-card p-2 transition-colors focus-within:border-ring">
        <button
          className="p-2 text-muted-foreground transition-none hover:text-foreground disabled:opacity-50"
          disabled={disabled}
          type="button"
        >
          <IconPaperclip size={20} />
        </button>
        <textarea
          className="max-h-[200px] min-h-6 flex-1 resize-none border-none bg-transparent py-2 font-sans text-foreground outline-none placeholder:font-mono placeholder:text-muted-foreground/50"
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="> TYPE_MESSAGE... (# for tasks)"
          ref={textareaRef}
          rows={1}
          value={content}
        />
        <button
          className="p-2 text-muted-foreground transition-none hover:text-primary disabled:opacity-50 disabled:hover:text-muted-foreground"
          disabled={disabled || !content.trim()}
          onClick={handleSend}
          type="button"
        >
          <IconSend size={20} />
        </button>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-muted-foreground/60 uppercase">
          # to mention a task
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/60 uppercase">
          Enter to send · Shift+Enter for new line
        </span>
      </div>
    </div>
  );
}
