"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

const tabs = [
  { segment: "overview", label: "Overview" },
  { segment: "issues", label: "Issues" },
  { segment: "blueprint", label: "AI Blueprint" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const workspace = params.workspace as string;
  const project = params.project as string;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col py-4">
      <div className="border-b px-4">
        <nav className="-mb-px flex gap-4">
          {tabs.map((tab) => {
            const href = `/${workspace}/projects/${project}/${tab.segment}`;
            const isActive = pathname.startsWith(href);
            return (
              <Link
                className={[
                  "border-b-2 px-1.5 pb-2 font-medium text-sm transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
                href={href}
                key={tab.segment}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="pb-4">{children}</div>
    </div>
  );
}
