import { relations, sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { cycles } from "./cycle";
import { workspaces } from "./workspace";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status", {
      enum: ["backlog", "planned", "in_progress", "completed", "cancelled"],
    })
      .notNull()
      .default("backlog"),
    priority: integer("priority").notNull().default(0),
    startDate: timestamp("start_date").defaultNow().notNull(),
    endDate: timestamp("end_date"),
    leadId: text("lead_id").references(() => users.id, {
      onDelete: "set null",
    }),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    check("priority_check", sql`${t.priority} >= 0 AND ${t.priority} <= 4`),
  ]
);

export const projectRelations = relations(projects, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  lead: one(users, {
    fields: [projects.leadId],
    references: [users.id],
  }),
}));

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description"),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    assigneeId: text("assignee_id").references(() => users.id),
    cycleId: uuid("cycle_id").references(() => cycles.id, {
      onDelete: "set null",
    }),
    status: text("status", {
      enum: ["backlog", "planned", "in_progress", "completed", "cancelled"],
    })
      .notNull()
      .default("backlog"),
    dueDate: timestamp("due_date"),
    priority: integer("priority").notNull().default(0), // 0: no priority, 1: low, 2: medium, 3: high, 4: urgent
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    check("priority_check", sql`${t.priority} >= 0 AND ${t.priority} <= 4`),
  ]
);

export const taskRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  workspace: one(workspaces, {
    fields: [tasks.workspaceId],
    references: [workspaces.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  cycle: one(cycles, {
    fields: [tasks.cycleId],
    references: [cycles.id],
  }),
}));

export const taskComments = pgTable("task_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  taskId: uuid("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id").references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskCommentRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));
