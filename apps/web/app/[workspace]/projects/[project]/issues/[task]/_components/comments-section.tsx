"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-provider";
import {
  createTaskComment,
  deleteTaskComment,
  listTaskComments,
  updateTaskComment,
} from "@/lib/comments";
import { getWorkspaceMembers } from "@/lib/workspace";
import { CommentComposer } from "./comment-composer";
import { CommentItem } from "./comment-item";

type CommentsSectionProps = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  highlightCommentId?: string | null;
};

export function CommentsSection({
  workspaceId,
  projectId,
  taskId,
  highlightCommentId,
}: CommentsSectionProps) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const currentUserId = session?.user?.id;

  const commentsQuery = useQuery({
    queryKey: ["task-comments", workspaceId, taskId],
    queryFn: async () => {
      const result = await listTaskComments(workspaceId, projectId, taskId);
      return result.data.comments;
    },
    enabled: !!workspaceId && !!taskId,
  });

  const { data: membersData } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const result = await getWorkspaceMembers(workspaceId);
      return result.data.members;
    },
    enabled: !!workspaceId,
    staleTime: 30_000,
  });

  const currentMember = membersData?.find((m) => m.userId === currentUserId);
  const isAdmin = currentMember?.role === "admin";

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: ["task-comments", workspaceId, taskId],
    });
  };

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      await createTaskComment(workspaceId, projectId, taskId, { content });
    },
    onSuccess: () => {
      invalidate();
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const editMutation = useMutation({
    mutationFn: async ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => {
      await updateTaskComment(workspaceId, projectId, taskId, commentId, {
        content,
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Comment updated");
    },
    onError: () => toast.error("Failed to update comment"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await deleteTaskComment(workspaceId, projectId, taskId, commentId);
    },
    onSuccess: () => {
      invalidate();
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  useEffect(() => {
    if (!(highlightCommentId && commentsQuery.data)) return;
    const el = document.getElementById(`comment-${highlightCommentId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightCommentId, commentsQuery.data]);

  const comments = commentsQuery.data ?? [];

  return (
    <section aria-labelledby="task-comments-heading" className="mt-8">
      <h2
        className="mb-4 flex items-center gap-2 font-semibold text-sm"
        id="task-comments-heading"
      >
        <MessageSquare aria-hidden className="size-4 text-muted-foreground" />
        Comments
        {comments.length > 0 ? (
          <span className="font-normal text-muted-foreground tabular-nums">
            ({comments.length})
          </span>
        ) : null}
      </h2>

      {comments.length > 0 && (
        <ol className="mb-6 space-y-4">
          {comments.map((comment) => (
            <li key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                highlighted={comment.id === highlightCommentId}
                isAdmin={isAdmin}
                isEditPending={editMutation.isPending}
                onDelete={(id) => deleteMutation.mutate(id)}
                onEdit={async (id, content) => {
                  await editMutation.mutateAsync({ commentId: id, content });
                }}
                workspaceId={workspaceId}
              />
            </li>
          ))}
        </ol>
      )}

      <CommentComposer
        isPending={createMutation.isPending}
        onSubmit={async (content) => {
          await createMutation.mutateAsync(content);
        }}
        workspaceId={workspaceId}
      />
    </section>
  );
}
