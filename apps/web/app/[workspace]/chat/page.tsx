export default function ChatPage() {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center bg-background p-8 text-foreground">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="font-bold font-mono text-2xl text-primary uppercase tracking-widest">
          TERMINAL_RDY
        </h1>
        <p className="font-sans text-muted-foreground text-sm">
          Select a channel or direct message from the sidebar to establish a
          connection.
        </p>
        <div className="mt-8 flex justify-center space-x-2 font-mono text-muted-foreground/60 text-xs">
          <span>// STATUS:</span>
          <span className="animate-pulse text-primary">AWAITING_INPUT</span>
        </div>
      </div>
    </div>
  );
}
