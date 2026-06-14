import { useEffect, useRef } from "react";
import type { Message } from "@/lib/chat";
import { MessageItem } from "./message-item";

export function MessageList({
  messages,
  isLoading,
}: {
  messages: Message[];
  isLoading?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col justify-end space-y-4 overflow-y-auto p-4">
        {[...new Array(3)].map((_, i) => (
          <div className="flex animate-pulse gap-4 p-4" key={i}>
            <div className="h-10 w-10 rounded-full border border-border bg-muted" />
            <div className="flex flex-1 flex-col space-y-2">
              <div className="h-4 w-1/4 rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center font-mono text-muted-foreground/60 text-sm uppercase tracking-widest">
        // NO_MESSAGES_FOUND
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-4" ref={scrollRef}>
      <div className="flex min-h-full flex-col justify-end">
        {messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
}
