import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { members, messages } from '../db/schema.ts';
import { and, asc, eq } from 'drizzle-orm';
import db from '../db/connection.ts';

export const createChatMessage = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	try {
		const { content } = req.body;
		const { chatId } = req.params;
		const userId = req.user!.id;

		const member = await db.query.members.findFirst({
			where: and(eq(members.userId, userId), eq(members.chatId, chatId.toString())),
			with: { chat: true },
		});

		if (!member) {
			return res
				.status(403)
				.json({ error: 'You cannot send messages to this chat' });
		}

		const [newMessage] = await db
			.insert(messages)
			.values({
				chatId: chatId.toString(),
				content,
				userId,
			})
			.returning();

		res.status(201).json({
			message: 'Message sent successfully',
			data: newMessage,
		});
	} catch (error) {
		console.error('Create message error:', error);
		res.status(500).json({ error: 'Failed to create message' });
	}
};

export const getChatMessages = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const { chatId } = req.params;
		const userId = req.user!.id;

		const member = await db.query.members.findFirst({
			where: and(eq(members.userId, userId), eq(members.chatId, chatId.toString())),
			with: { chat: true },
		});

		if (!member) {
			return res
				.status(403)
				.json({ error: 'You cannot fetch messages of this chat' });
		}

		const chatMessages = await db.query.messages.findMany({
			where: eq(messages.chatId, chatId.toString()),
			with: {
				user: {
					columns: {
						username: true,
						isOnline: true,
						profilePicture: true,
						lastSeen: true,
					},
				},
			},
			orderBy: [asc(messages.createdAt)],
		});

		res.json({
			message: 'Messages fetched successfully',
			data: chatMessages,
		});
	} catch (error) {
		console.error('Fetch messages error:', error);
		res.status(500).json({ error: 'Failed to fetch messages' });
	}
};

export const updateMessage = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const { id, chatId } = req.params;
		const { content } = req.body;
		const userId = req.user!.id;

		const [updatedMessage] = await db
			.update(messages)
			.set({
				content,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(messages.id, id.toString()),
					eq(messages.userId, userId),
					eq(messages.chatId, chatId.toString()),
				),
			)
			.returning();

		if (!updatedMessage) {
			return res.status(404).json({ error: 'Message not found' });
		}

		return res.json({
			message: 'Message updated successfully',
			data: updatedMessage,
		});
	} catch (error) {
		console.error('Edit message error:', error);
		res.status(500).json({ error: 'Failed to edit message' });
	}
};

export const deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const { id, chatId } = req.params;
		const userId = req.user!.id;

		const [deletedMessage] = await db
			.delete(messages)
			.where(
				and(
					eq(messages.userId, userId),
					eq(messages.chatId, chatId.toString()),
					eq(messages.id, id.toString()),
				),
			)
			.returning();

		if (!deletedMessage) {
			return res.status(404).json({ error: 'Message not found' });
		}

		res.json({
			message: 'Message deleted successfully',
		});
	} catch (error) {
		console.error('Delete message error:', error);
		res.status(500).json({ error: 'Failed to delete message' });
	}
};
