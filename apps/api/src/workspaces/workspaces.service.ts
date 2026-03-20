import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { and, count, desc, eq, inArray, or } from "drizzle-orm";
import { ok } from "@/common/response";
import { db } from "@/db";
import { tasks, users, workspaceMembers, workspaces } from "@/db/schema";
import { attempt } from "@/lib/error-handling";

@Injectable()
export class WorkspacesService {
  async getAllTasks(workspaceId: string) {
    const [tasksResult, error] = await attempt(
      db
        .select({
          id: tasks.id,
          name: tasks.name,
          description: tasks.description,
          assigneeId: tasks.assigneeId,
          assigneeName: users.name,
          assigneeEmail: users.email,
          status: tasks.status,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.assigneeId, users.id))
        .where(eq(tasks.workspaceId, workspaceId))
        .orderBy(desc(tasks.priority), desc(tasks.createdAt))
    );
    if (error) {
      throw new InternalServerErrorException("Failed to get all tasks");
    }
    return ok({ tasks: tasksResult ?? [] });
  }

  async createWorkspace(
    workspaceName: string,
    workspaceSlug: string,
    ownerId: string
  ) {
    const [foundWorkspace, foundWorkspaceError] = await attempt(
      db
        .select()
        .from(workspaces)
        .where(
          or(
            eq(workspaces.name, workspaceName),
            eq(workspaces.slug, workspaceSlug)
          )
        )
        .limit(1)
    );
    if (foundWorkspaceError) {
      throw new InternalServerErrorException(
        "Failed to check if workspace exists"
      );
    }
    if (foundWorkspace?.[0]?.id) {
      throw new ConflictException("Workspace already exists");
    }

    const [workspace, error] = await attempt(
      db
        .insert(workspaces)
        .values({ name: workspaceName, slug: workspaceSlug, ownerId })
        .returning({ id: workspaces.id })
    );
    if (error) {
      throw new InternalServerErrorException("Failed to create workspace");
    }

    const [, addOwnerError] = await attempt(
      db.insert(workspaceMembers).values({
        workspaceId: workspace?.[0]?.id,
        userId: ownerId,
        role: "admin",
      })
    );
    if (addOwnerError) {
      throw new InternalServerErrorException(
        "Failed to add owner to workspace"
      );
    }

    return ok({ workspaceId: workspace?.[0]?.id });
  }

  async findWorkspaceBySlug(slug: string, userId: string) {
    const [workspace, error] = await attempt(
      db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          ownerId: workspaces.ownerId,
        })
        .from(workspaces)
        .leftJoin(
          workspaceMembers,
          eq(workspaces.id, workspaceMembers.workspaceId)
        )
        .where(
          and(
            eq(workspaces.slug, slug),
            or(
              eq(workspaceMembers.userId, userId),
              eq(workspaces.ownerId, userId)
            )
          )
        )
        .limit(1)
    );
    if (error) {
      throw new InternalServerErrorException(
        "Failed to find workspace by slug"
      );
    }
    if (!workspace?.[0]) {
      throw new NotFoundException("Workspace not found");
    }
    return ok({ workspace: workspace?.[0] });
  }

  async getWorkspaces(offset: number, limit: number, userId: string) {
    const [total, totalError] = await attempt(
      db
        .select({ count: count(workspaces.id) })
        .from(workspaces)
        .leftJoin(
          workspaceMembers,
          eq(workspaces.id, workspaceMembers.workspaceId)
        )
        .where(
          and(
            eq(workspaces.ownerId, userId),
            or(
              eq(workspaceMembers.userId, userId),
              eq(workspaces.ownerId, userId)
            )
          )
        )
    );
    if (totalError || total?.[0]?.count === undefined) {
      throw new InternalServerErrorException("Failed to get total workspaces");
    }

    const [workspacesResult, workspacesError] = await attempt(
      db
        .selectDistinct({
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          accessedAt: workspaces.accessedAt,
          createdAt: workspaces.createdAt,
          updatedAt: workspaces.updatedAt,
        })
        .from(workspaces)
        .leftJoin(
          workspaceMembers,
          eq(workspaces.id, workspaceMembers.workspaceId)
        )
        .where(
          or(
            eq(workspaceMembers.userId, userId),
            eq(workspaces.ownerId, userId)
          )
        )
        .orderBy(desc(workspaces.accessedAt))
        .offset(offset)
        .limit(limit)
    );
    if (workspacesError) {
      throw new InternalServerErrorException("Failed to get workspaces");
    }
    return ok({
      workspaces: workspacesResult ?? [],
      total: total?.[0]?.count,
    });
  }

  async addMemberToWorkspace(
    workspaceId: string,
    emails: string[],
    role: "admin" | "developer" | "viewer",
    userId: string
  ) {
    const [isAdmin, isAdminError] = await attempt(
      db
        .select({ isAdmin: eq(workspaceMembers.role, "admin") })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId)
          )
        )
        .limit(1)
    );
    if (isAdminError) {
      throw new InternalServerErrorException(
        "Failed to check if user is admin"
      );
    }
    if (!isAdmin?.[0]?.isAdmin) {
      throw new ForbiddenException(
        "You are not authorized to add members to this workspace"
      );
    }

    const [foundMembers, foundMembersError] = await attempt(
      db
        .select()
        .from(workspaceMembers)
        .leftJoin(users, eq(workspaceMembers.userId, users.id))
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            inArray(users.email, emails)
          )
        )
        .limit(1)
    );
    if (foundMembersError) {
      throw new InternalServerErrorException(
        "Failed to check if member exists"
      );
    }
    if (foundMembers.length > 0) {
      throw new ConflictException("Member already exists");
    }

    const [foundUsers, foundUsersError] = await attempt(
      db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.email, emails))
    );
    if (foundUsersError) {
      throw new InternalServerErrorException("Failed to find user");
    }

    if (foundUsers.length !== emails.length) {
      throw new NotFoundException("Some users not found");
    }

    const [, addMembersError] = await attempt(
      db.insert(workspaceMembers).values(
        foundUsers.map((user) => ({
          workspaceId,
          userId: user.id,
          role,
        }))
      )
    );
    if (addMembersError) {
      throw new InternalServerErrorException(
        "Failed to add member to workspace"
      );
    }
    return ok({ success: true });
  }

  async getWorkspaceMembers(workspaceId: string) {
    const [members, error] = await attempt(
      db
        .select({
          id: workspaceMembers.id,
          userId: workspaceMembers.userId,
          workspaceId: workspaceMembers.workspaceId,
          name: users.name,
          email: users.email,
          image: users.image,
          role: workspaceMembers.role,
          addedAt: workspaceMembers.addedAt,
        })
        .from(workspaceMembers)
        .leftJoin(users, eq(workspaceMembers.userId, users.id))
        .where(eq(workspaceMembers.workspaceId, workspaceId))
        .orderBy(desc(workspaceMembers.addedAt))
    );
    if (error) {
      throw new InternalServerErrorException("Failed to get workspace members");
    }
    return ok({ members: members ?? [] });
  }

  async updateWorkspaceAccessedAt(slug: string, userId: string) {
    const [workspace, error] = await attempt(
      db
        .update(workspaces)
        .set({ accessedAt: new Date() })
        .where(and(eq(workspaces.slug, slug), eq(workspaces.ownerId, userId)))
        .returning({ id: workspaces.id })
    );
    if (error) {
      throw new InternalServerErrorException(
        "Failed to update workspace accessed at"
      );
    }
    return ok({ success: true, workspaceId: workspace?.[0]?.id ?? null });
  }

  async updateMemberRole(
    userId: string,
    workspaceId: string,
    memberId: number,
    role: "admin" | "developer" | "viewer"
  ) {
    const [isAdmin, isAdminError] = await attempt(
      db
        .select({ isAdmin: eq(workspaceMembers.role, "admin") })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.userId, userId)
          )
        )
        .limit(1)
    );
    if (isAdminError) {
      throw new InternalServerErrorException(
        "Failed to check if user is admin"
      );
    }
    if (!isAdmin?.[0]?.isAdmin) {
      throw new ForbiddenException(
        "You are not authorized to update member role"
      );
    }

    const [, error] = await attempt(
      db
        .update(workspaceMembers)
        .set({ role })
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.id, memberId)
          )
        )
    );
    if (error) {
      throw new InternalServerErrorException("Failed to update member role");
    }
    return ok({ success: true });
  }

  async getMyTasks(workspaceId: string, userId: string) {
    const [tasksResult, error] = await attempt(
      db
        .select({
          id: tasks.id,
          name: tasks.name,
          description: tasks.description,
          projectId: tasks.projectId,
          assigneeId: tasks.assigneeId,
          assigneeName: users.name,
          assigneeEmail: users.email,
          status: tasks.status,
          dueDate: tasks.dueDate,
          priority: tasks.priority,
        })
        .from(tasks)
        .leftJoin(users, eq(tasks.assigneeId, users.id))
        .where(
          and(eq(tasks.workspaceId, workspaceId), eq(tasks.assigneeId, userId))
        )
        .orderBy(desc(tasks.priority), desc(tasks.createdAt))
    );
    if (error) {
      throw new InternalServerErrorException("Failed to get my tasks");
    }
    return ok({ tasks: tasksResult ?? [] });
  }
}
