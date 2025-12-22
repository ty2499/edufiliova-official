import { pgTable, text, uuid, timestamp, integer, unique, varchar, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Community Schema for Drizzle ORM + PostgreSQL
// This matches the actual database structure

// Community Posts - Discussion posts (matching actual table structure)
export const posts = pgTable("community_posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(), // FK to auth_users.user_id
  title: varchar("title").notNull(), 
  content: text("content").notNull(),
  subject: varchar("subject"), // Optional subject classification
  grade: integer("grade"),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  likes: integer("likes").default(0),
  replies: integer("replies").default(0),
  views: integer("views").default(0),
  isAnonymous: boolean("is_anonymous").default(false),
  isModerated: boolean("is_moderated").default(false),
  isPinned: boolean("is_pinned").default(false),
  moderatorId: varchar("moderator_id"),
  topicType: text("topic_type").default("discussion"),
  groupId: uuid("group_id"),
  body: text("body"), // Alternative content field
  isTest: boolean("is_test").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Community Replies - Comments on posts (matching actual table structure)
export const replies = pgTable("community_replies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: uuid("post_id").references(() => posts.id, { onDelete: "cascade" }).notNull(),
  authorId: varchar("author_id").notNull(), // FK to auth_users.user_id
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Community Reactions - Likes and other reactions (matching actual table structure)
export const likes = pgTable("community_reactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull(), // FK to auth_users.id
  targetType: text("target_type").notNull(), // "post" or "reply"
  targetId: uuid("target_id").notNull(), // References posts.id or replies.id
  emoji: text("emoji").notNull().default("👍"), // Default like emoji
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one reaction per user per target
  userTargetUnique: unique().on(table.userId, table.targetType, table.targetId)
}));

// Friendships - Single table for requests and accepted friends (matching actual table structure)
export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  requesterId: uuid("requester_id").notNull(), // FK to auth_users.id
  receiverId: uuid("receiver_id").notNull(), // FK to auth_users.id
  status: text("status").notNull().default("pending"), // "pending" | "accepted" | "blocked" | "rejected"
  requestMessage: text("request_message"),
  connectionType: text("connection_type").default("friend"),
  commonSubjects: text("common_subjects").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one friendship per requester-receiver pair
  requesterReceiverUnique: unique().on(table.requesterId, table.receiverId)
}));

// Zod Schemas
export const insertPostSchema = createInsertSchema(posts).omit({ 
  id: true, createdAt: true, updatedAt: true 
});
export const insertReplySchema = createInsertSchema(replies).omit({ 
  id: true, createdAt: true 
});
export const insertLikeSchema = createInsertSchema(likes).omit({ 
  id: true, createdAt: true 
});
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ 
  id: true, createdAt: true 
});

export const selectPostSchema = createSelectSchema(posts);
export const selectReplySchema = createSelectSchema(replies);
export const selectLikeSchema = createSelectSchema(likes);
export const selectFriendshipSchema = createSelectSchema(friendships);

// Types
export type Post = typeof posts.$inferSelect;
export type Reply = typeof replies.$inferSelect;
export type Like = typeof likes.$inferSelect;
export type Friendship = typeof friendships.$inferSelect;

export type InsertPost = typeof posts.$inferInsert;
export type InsertReply = typeof replies.$inferInsert;
export type InsertLike = typeof likes.$inferInsert;
export type InsertFriendship = typeof friendships.$inferInsert;