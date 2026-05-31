import {
	pgTable,
	uuid,
	varchar,
	text,
	timestamp,
	boolean,
	pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// Users Table
export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	username: varchar('username', { length: 255 }).notNull().unique(),
	password: varchar('password', { length: 255 }).notNull(),
	firstName: varchar('first_name', { length: 50 }),
	lastName: varchar('last_name', { length: 50 }),
	profilePicture: varchar('profile_picture'),
	isOnline: boolean('is_online').default(false),
	lastSeen: timestamp('last_seen').defaultNow().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Chats Table
export const chats = pgTable('chats', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 255 }),
	isGroup: boolean('is_group').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Messages Table
export const messageStatusEnum = pgEnum('message_status', [
	'sent',
	'delivered',
	'read',
	'failed',
]);
export const messages = pgTable('messages', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	chatId: uuid('chat_id')
		.references(() => chats.id, { onDelete: 'cascade' })
		.notNull(),
	content: text('content').notNull(),
	status: messageStatusEnum('status').default('sent').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const members = pgTable('members', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),
	chatId: uuid('chat_id')
		.references(() => chats.id, { onDelete: 'cascade' })
		.notNull(),
	isAdmin: boolean('is_admin').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userRelations = relations(users, ({ many }) => ({
	members: many(members),
	messages: many(messages),
}));

export const chatsRelations = relations(chats, ({ many }) => ({
	members: many(members),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
	user: one(users, {
		fields: [messages.userId],
		references: [users.id],
	}),
	chat: one(chats, {
		fields: [messages.chatId],
		references: [chats.id],
	}),
}));

export const membersRelations = relations(members, ({ one }) => ({
	user: one(users, {
		fields: [members.userId],
		references: [users.id],
	}),
	chat: one(chats, {
		fields: [members.chatId],
		references: [chats.id],
	}),
}));
