export function NotificationEmpty() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
      {/* Layered geometric icon */}
      <div className="relative">
        <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-muted-foreground/15 border-dashed bg-muted/10">
          <div className="flex size-9 items-center justify-center rounded-xl border border-muted-foreground/20 bg-muted/30">
            <svg
              className="size-4 text-muted-foreground/40"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
        </div>
        {/* Decorative dots */}
        <span className="-right-1 -top-1 absolute h-2 w-2 rounded-full bg-muted-foreground/10" />
        <span className="-bottom-0.5 -left-1.5 absolute h-1.5 w-1.5 rounded-full bg-muted-foreground/10" />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-semibold text-base tracking-tight">
          You&apos;re all caught up
        </h2>
        <p className="max-w-[280px] text-muted-foreground text-sm leading-relaxed">
          Notifications about assigned issues, project ownership, and activity
          will appear here.
        </p>
      </div>
    </div>
  );
}
