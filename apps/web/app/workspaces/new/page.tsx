import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CreateWorkspaceForm } from "./create-workspace-form";

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

export const metadata: Metadata = {
  title: "Create workspace",
  description: "Set up a new workspace for your team.",
};

export default function Page() {
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
        <Link
          className={cn(
            "group motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:animate-in motion-safe:duration-500",
            "inline-flex w-fit items-center gap-2 border border-transparent py-1 text-muted-foreground text-xs transition-colors hover:border-foreground/15 hover:bg-foreground/3 hover:text-foreground"
          )}
          href="/workspaces"
        >
          <ArrowLeft className="group-hover:-translate-x-0.5 size-3 transition-transform" />
          All workspaces
        </Link>

        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[minmax(0,1fr)_220px] md:gap-14 lg:grid-cols-[minmax(0,1fr)_280px]">
          <header className="motion-safe:fade-in motion-safe:slide-in-from-bottom-3 relative space-y-5 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:duration-700">
            <div className="flex flex-wrap items-end gap-6">
              <div className="space-y-4">
                <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.32em]">
                  Onboarding
                </p>
                <h1
                  className={cn(
                    fontDisplay.className,
                    "max-w-[14ch] font-extrabold text-[clamp(2.25rem,5vw,3.75rem)] leading-[0.95] tracking-tight"
                  )}
                >
                  A new home for your{" "}
                  <span className="underline decoration-2 decoration-primary underline-offset-4">
                    team
                  </span>
                </h1>
              </div>
              <span
                aria-hidden
                className={cn(
                  fontDisplay.className,
                  "hidden select-none font-extrabold text-[clamp(4rem,12vw,7rem)] text-foreground/6 leading-none md:block dark:text-foreground/8"
                )}
              >
                01
              </span>
            </div>
            <p className="max-w-lg text-pretty text-muted-foreground text-sm leading-relaxed md:text-base">
              Name your workspace and pick a URL slug. Invites and permissions
              come next — we keep the first mile calm and intentional.
            </p>
          </header>

          <aside className="hidden md:block">
            <p className="border-primary/40 border-l-2 pl-4 font-medium text-foreground text-xs leading-relaxed">
              Workspaces stay private until you add members. Slugs are
              permanent, so pick something you will still want on the roadmap a
              year from now.
            </p>
          </aside>
        </div>

        <div className="motion-safe:fade-in motion-safe:slide-in-from-bottom-4 mt-10 motion-safe:animate-in motion-safe:fill-mode-both motion-safe:delay-150 motion-safe:duration-700 md:mt-14">
          <CreateWorkspaceForm />
        </div>
      </div>
    </div>
  );
}
