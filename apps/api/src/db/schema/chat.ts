import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth-schema";
import { workspaces } from "./workspace";

export const chatThreadTypes = ["channel", "dm"] as const;

export type ChatThreadType = (typeof chatThreadTypes)[number];

export const chatThreadVisibilities = ["public", "private"] as const;

export type ChatThreadVisibility = (typeof chatThreadVisibilities)[number];

export const chatThreads = pgTable(
  "chat_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    type: text("type", { enum: chatThreadTypes }).notNull(),
    name: text("name"),
    visibility: text("visibility", { enum: chatThreadVisibilities }),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    dmKey: text("dm_key"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    uniqueIndex("chat_threads_workspace_dm_key_idx").on(t.workspaceId, t.dmKey),
    index("chat_threads_workspace_type_idx").on(t.workspaceId, t.type),
    check(
      "chat_threads_shape_check",
      sql`(
        ${t.type} = 'dm'
        AND ${t.dmKey} IS NOT NULL
        AND ${t.visibility} IS NULL
        AND ${t.name} IS NULL
      ) OR (
        ${t.type} = 'channel'
        AND ${t.dmKey} IS NULL
        AND ${t.visibility} IS NOT NULL
        AND ${t.name} IS NOT NULL
      )`
    ),
  ]
);

export const chatThreadMembers = pgTable(
  "chat_thread_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    threadId: uuid("thread_id")
      .references(() => chatThreads.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("chat_thread_members_thread_user_idx").on(t.threadId, t.userId),
    index("chat_thread_members_workspace_user_idx").on(t.workspaceId, t.userId),
  ]
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    threadId: uuid("thread_id")
      .references(() => chatThreads.id, { onDelete: "cascade" })
      .notNull(),
    senderId: text("sender_id").references(() => users.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    index("chat_messages_thread_created_idx").on(t.threadId, t.createdAt),
    index("chat_messages_workspace_sender_created_idx").on(
      t.workspaceId,
      t.senderId,
      t.createdAt
    ),
  ]
);

export const chatMessageAttachments = pgTable(
  "chat_message_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    messageId: uuid("message_id")
      .references(() => chatMessages.id, { onDelete: "cascade" })
      .notNull(),
    fileUrl: text("file_url").notNull(),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("chat_message_attachments_message_idx").on(t.messageId)]
);

export const chatThreadRelations = relations(chatThreads, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [chatThreads.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, {
    fields: [chatThreads.createdById],
    references: [users.id],
  }),
  members: many(chatThreadMembers),
  messages: many(chatMessages),
}));

export const chatThreadMemberRelations = relations(
  chatThreadMembers,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [chatThreadMembers.workspaceId],
      references: [workspaces.id],
    }),
    thread: one(chatThreads, {
      fields: [chatThreadMembers.threadId],
      references: [chatThreads.id],
    }),
    user: one(users, {
      fields: [chatThreadMembers.userId],
      references: [users.id],
    }),
  })
);

export const chatMessageRelations = relations(chatMessages, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [chatMessages.workspaceId],
    references: [workspaces.id],
  }),
  thread: one(chatThreads, {
    fields: [chatMessages.threadId],
    references: [chatThreads.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
  attachments: many(chatMessageAttachments),
}));

export const chatMessageAttachmentRelations = relations(
  chatMessageAttachments,
  ({ one }) => ({
    workspace: one(workspaces, {
      fields: [chatMessageAttachments.workspaceId],
      references: [workspaces.id],
    }),
    message: one(chatMessages, {
      fields: [chatMessageAttachments.messageId],
      references: [chatMessages.id],
    }),
  })
);
