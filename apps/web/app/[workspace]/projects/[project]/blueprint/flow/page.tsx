"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Background,
  type ColorMode,
  Controls,
  Edge,
  MiniMap,
  ReactFlow,
  useNodesState,
} from "@xyflow/react";
import { ArrowLeft, GitBranch } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import "@xyflow/react/dist/style.css";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { getBlueprint } from "@/lib/blueprint";
import { attempt } from "@/lib/error-handling";

export default function BlueprintFlowPage() {
  const params = useParams();
  const { theme } = useTheme();
  const workspaceId = params.workspace as string;
  const projectId = params.project as string;
  const [nodes, setNodes, onNodesChange] = useNodesState([]);

  const { data, isLoading } = useQuery({
    queryKey: ["blueprint-flow", workspaceId, projectId],
    queryFn: async () => {
      const [result, error] = await attempt(
        getBlueprint(workspaceId, projectId)
      );
      if (error) {
        toast.error("Failed to load blueprint flow");
        throw error;
      }
      setNodes(result.blueprint.userFlow.nodes as any);
      return result;
    },
    enabled: !!workspaceId && !!projectId,
  });

  if (isLoading || !data) {
    return <Loading />;
  }

  const projectName = data.blueprint.projectName;

  return (
    <div className="relative h-[calc(100vh-5rem)] w-full overflow-hidden rounded-lg border bg-card">
      {/* Floating toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-lg border bg-background/95 px-3 py-2 shadow-sm backdrop-blur-sm">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <GitBranch className="size-3.5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-xs leading-none">{projectName}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground leading-none">
              User flow diagram
            </p>
          </div>
        </div>

        <Button
          asChild
          className="gap-1.5 bg-background/95 shadow-sm backdrop-blur-sm"
          size="sm"
          variant="outline"
        >
          <Link href={`/${workspaceId}/projects/${projectId}/blueprint/review`}>
            <ArrowLeft className="size-3.5" />
            Back to blueprint
          </Link>
        </Button>
      </div>

      <ReactFlow
        colorMode={theme as ColorMode}
        edges={data.blueprint.userFlow.edges as Edge[]}
        fitView
        nodes={nodes}
        onNodesChange={onNodesChange}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls className="rounded-lg border bg-background/95 shadow-sm backdrop-blur-sm" />
        <MiniMap
          className="rounded-lg border bg-background/95 shadow-sm backdrop-blur-sm"
          nodeStrokeWidth={3}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
