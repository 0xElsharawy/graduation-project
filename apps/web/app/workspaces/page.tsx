"use client";

import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { ArrowRight, Plus } from "lucide-react";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { currentWorkspaceAtom } from "@/lib/atoms/current-workspace";
import { attempt } from "@/lib/error-handling";
import { cn } from "@/lib/utils";
import { listWorkspaces, type Workspace } from "@/lib/workspace";

const fontDisplay = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-ws-display",
  display: "swap",
});

const fontSans = Figtree({
  subsets: ["latin"],
  variable: "--font-ws-body",
  display: "swap",
});

const ITEMS_PER_PAGE = 12;

export default function WorkspacesPage() {
  const router = useRouter();
  const [, setActiveWorkspace] = useAtom(currentWorkspaceAtom);
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["workspaces", currentPage],
    queryFn: async () => {
      const [result, error] = await attempt(
        listWorkspaces(currentPage, ITEMS_PER_PAGE)
      );
      if (error || !result) {
        toast.error("Error while fetching workspaces");
        return { workspaces: [], total: 0 };
      }
      return result.data;
    },
  });

  const workspaces = data?.workspaces ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleWorkspaceClick = (workspace: Workspace) => {
    setActiveWorkspace(workspace);
    router.push(`/${encodeURIComponent(workspace.slug)}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageClick =
    (page: number) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      handlePageChange(page);
    };

  const renderPaginationItems = () => {
    const items: React.ReactNode[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              className="min-w-9 rounded-none border border-transparent data-[active=true]:border-primary/40 data-[active=true]:bg-primary/8"
              href="#"
              isActive={i === currentPage}
              onClick={handlePageClick(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      return items;
    }

    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          className="min-w-9 rounded-none border border-transparent data-[active=true]:border-primary/40 data-[active=true]:bg-primary/8"
          href="#"
          isActive={currentPage === 1}
          onClick={handlePageClick(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      start = 2;
      end = 4;
    }

    if (currentPage >= totalPages - 2) {
      start = totalPages - 3;
      end = totalPages - 1;
    }

    if (start > 2) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            className="min-w-9 rounded-none border border-transparent data-[active=true]:border-primary/40 data-[active=true]:bg-primary/8"
            href="#"
            isActive={i === currentPage}
            onClick={handlePageClick(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (end < totalPages - 1) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    items.push(
      <PaginationItem key={totalPages}>
        <PaginationLink
          className="min-w-9 rounded-none border border-transparent data-[active=true]:border-primary/40 data-[active=true]:bg-primary/8"
          href="#"
          isActive={totalPages === currentPage}
          onClick={handlePageClick(totalPages)}
        >
          {totalPages}
        </PaginationLink>
      </PaginationItem>
    );

    return items;
  };

  return (
    <div
      className={cn(
        fontSans.className,
        fontDisplay.variable,
        "relative min-h-screen overflow-hidden bg-[oklch(0.985_0.012_95)] text-foreground dark:bg-background"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_0%_-20%,oklch(0.62_0.12_195/0.14),transparent_55%),radial-gradient(ellipse_90%_60%_at_100%_20%,oklch(0.58_0.16_48/0.1),transparent_50%)] dark:bg-[radial-gradient(ellipse_120%_80%_at_0%_-20%,oklch(0.55_0.18_264/0.25),transparent_55%),radial-gradient(ellipse_90%_60%_at_100%_20%,oklch(0.58_0.14_48/0.12),transparent_50%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(0_0_0/0.028)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0_0_0/0.028)_1px,transparent_1px)] bg-size-[40px_40px] dark:bg-[linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)]"
      />
      <div
        aria-hidden
        className="-right-24 pointer-events-none absolute top-24 h-[min(120vh,900px)] w-px bg-linear-to-b from-transparent via-foreground/12 to-transparent md:right-[12%]"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pt-8 pb-20 md:px-8 md:pt-12 md:pb-24">
        <header className="motion-safe:fade-in motion-safe:slide-in-from-bottom-3 flex flex-col gap-8 border-foreground/10 border-b pb-10 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-700 md:flex-row md:items-end md:justify-between md:pb-12">
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-5">
              <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.32em]">
                Directory
              </p>
              <div className="flex flex-wrap items-end gap-6">
                <h1
                  className={cn(
                    fontDisplay.className,
                    "max-w-[18ch] font-extrabold text-[clamp(2rem,4.5vw,3.25rem)] leading-[0.95] tracking-tight"
                  )}
                >
                  Your{" "}
                  <span className="underline decoration-2 decoration-primary underline-offset-4">
                    workspaces
                  </span>
                </h1>
                <span
                  aria-hidden
                  className={cn(
                    fontDisplay.className,
                    "hidden select-none font-extrabold text-[clamp(3.5rem,10vw,6rem)] text-foreground/6 leading-none md:block dark:text-foreground/8"
                  )}
                >
                  {total > 0 ? String(total).padStart(2, "0") : "—"}
                </span>
              </div>
              <p className="max-w-xl text-pretty text-muted-foreground text-sm leading-relaxed md:text-base">
                Open a workspace to pick up where you left off, or spin up a new
                one when a team or project deserves its own home.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="h-11 shrink-0 rounded-none px-6 font-semibold shadow-none"
          >
            <Link
              className="inline-flex items-center gap-2"
              href="/workspaces/new"
            >
              <Plus className="size-4" />
              New workspace
            </Link>
          </Button>
        </header>

        <section
          aria-busy={isLoading}
          className="mt-10 flex flex-1 flex-col md:mt-14"
        >
          {isLoading ? (
            <ul className="grid list-none gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <li
                  className="border border-foreground/10 bg-card/40 p-5 backdrop-blur-[2px] dark:bg-card/30"
                  key={i}
                >
                  <div className="flex gap-4">
                    <Skeleton className="size-12 shrink-0 rounded-none" />
                    <div className="flex flex-1 flex-col gap-3">
                      <Skeleton className="h-5 w-36 rounded-none" />
                      <Skeleton className="h-3 w-28 rounded-none" />
                      <Skeleton className="mt-2 h-3 w-full max-w-[200px] rounded-none" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {!isLoading && workspaces.length > 0 ? (
            <>
              <ul className="grid list-none gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workspaces.map((workspace, index) => (
                  <li
                    className="motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-500"
                    key={workspace.id}
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <button
                      className={cn(
                        "group relative w-full cursor-pointer border border-foreground/10 bg-card/50 text-left backdrop-blur-[2px] transition-[border-color,box-shadow,transform] duration-200",
                        "hover:border-primary/35 hover:shadow-[4px_4px_0_0_oklch(0.488_0.243_264.376/0.2)] dark:bg-card/40",
                        "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                      )}
                      onClick={() => handleWorkspaceClick(workspace)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleWorkspaceClick(workspace);
                        }
                      }}
                      type="button"
                    >
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-0.5 bg-primary opacity-80 transition-transform duration-200 group-hover:scale-y-110"
                      />
                      <span className="flex flex-col gap-4 p-5 pl-6">
                        <span className="flex items-start gap-4">
                          <span className="flex size-12 shrink-0 items-center justify-center border border-foreground/15 bg-primary/10 font-mono text-primary text-xs uppercase tracking-wider dark:bg-primary/15">
                            {workspace.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1 space-y-1">
                            <span className="block font-semibold text-base leading-tight tracking-tight">
                              {workspace.name}
                            </span>
                            <span className="block font-mono text-[11px] text-muted-foreground tracking-wide">
                              /{workspace.slug}
                            </span>
                          </span>
                          <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
                        </span>
                        <span className="flex flex-wrap gap-x-4 gap-y-1 border-foreground/10 border-t pt-4 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                          <span>
                            Created{" "}
                            {new Date(workspace.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                          <span className="text-foreground/25">·</span>
                          <span>
                            Opened{" "}
                            {new Date(workspace.accessedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {totalPages > 1 ? (
                <div className="mt-12 flex justify-center border-foreground/10 border-t pt-10">
                  <Pagination aria-label="Workspace pages">
                    <PaginationContent className="gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          className={cn(
                            "rounded-none border border-transparent hover:border-foreground/15 hover:bg-foreground/5",
                            currentPage === 1 &&
                              "pointer-events-none opacity-40"
                          )}
                          href="#"
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              handlePageChange(currentPage - 1);
                            }
                          }}
                        />
                      </PaginationItem>
                      {renderPaginationItems()}
                      <PaginationItem>
                        <PaginationNext
                          className={cn(
                            "rounded-none border border-transparent hover:border-foreground/15 hover:bg-foreground/5",
                            currentPage === totalPages &&
                              "pointer-events-none opacity-40"
                          )}
                          href="#"
                          onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              handlePageChange(currentPage + 1);
                            }
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
            </>
          ) : null}

          {!isLoading && workspaces.length === 0 ? (
            <div className="motion-safe:fade-in motion-safe:slide-in-from-bottom-3 flex flex-1 flex-col items-center justify-center gap-8 border border-foreground/20 border-dashed bg-card/30 px-6 py-20 text-center motion-safe:animate-in motion-safe:duration-700 md:py-28">
              <div className="space-y-3">
                <p
                  className={cn(
                    fontDisplay.className,
                    "font-extrabold text-2xl tracking-tight md:text-3xl"
                  )}
                >
                  Nothing here yet
                </p>
                <p className="mx-auto max-w-md text-muted-foreground text-sm leading-relaxed">
                  Create a workspace to organize projects, issues, and people in
                  one place. You can add more any time.
                </p>
              </div>
              <Button
                asChild
                className="h-11 rounded-none px-8 font-semibold shadow-none"
              >
                <Link
                  className="inline-flex items-center gap-2"
                  href="/workspaces/new"
                >
                  <Plus className="size-4" />
                  Create your first workspace
                </Link>
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
