import { ChatSidebar } from "./_components/chat-sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-50px)] w-full overflow-hidden bg-background font-sans">
      <ChatSidebar />
      <div className="relative flex flex-1 flex-col border-border border-l">
        {children}
      </div>
    </div>
  );
}
