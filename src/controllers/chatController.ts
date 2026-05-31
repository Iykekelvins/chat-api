import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { chats, members, messages } from '../db/schema.ts';
import { and, asc, desc, eq } from 'drizzle-orm';
import db from '../db/connection.ts';

export const createChat = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const { name, isGroup, memberIds } = req.body;
		const userId = req.user!.id;
		const allMemberIds = [...new Set([userId, ...memberIds])];

		const result = await db.transaction(async (transaction) => {
			const [newChat] = await transaction
				.insert(chats)
				.values({
					name,
					isGroup,
				})
				.returning();

			if (memberIds && memberIds.length > 0) {
				const memberIdValues = allMemberIds.map((memberId: string) => ({
					userId: memberId,
					chatId: newChat.id,
					isAdmin: memberId === userId ? true : false,
				}));

				await transaction.insert(members).values(memberIdValues);
			}

			return newChat;
		});

		res.status(201).json({
			message: 'Chat created successfully',
			chat: result,
		});
	} catch (error) {
		console.error('Create chat error:', error);
		res.status(500).json({ error: 'Failed to create chat' });
	}
};

export const getChats = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user!.id;

		const userChats = await db.query.members.findMany({
			where: eq(members.userId, userId),
			with: {
				chat: true,
			},
			orderBy: [desc(members.createdAt)],
		});

		res.json({
			chats: userChats.map((member) => member.chat),
		});
	} catch (error) {
		console.error('Fetch chats error:', error);
		res.status(500).json({ error: 'Failed to fetch chats' });
	}
};

export const getChatById = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const { id } = req.params;
		const userId = req.user!.id;

		const chat = await db.query.members.findFirst({
			where: and(eq(members.userId, userId), eq(members.chatId, id.toString())),
			with: {
				chat: {
					with: {
						members: {
							columns: {
								id: true,
								isAdmin: true,
							},
							with: {
								user: {
									columns: {
										username: true,
										isOnline: true,
										profilePicture: true,
									},
								},
							},
						},
						messages: {
							orderBy: [asc(messages.createdAt)],
						},
					},
				},
			},
		});

		if (!chat) {
			return res.status(404).json({ error: 'Chat not found' });
		}

		res.json({ chat: chat.chat });
	} catch (error) {
		console.error('Fetch chat error:', error);
		res.status(500).json({ error: 'Failed to fetch chat' });
	}
};

export const deleteChat = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const { id } = req.params;
		const userId = req.user!.id;

		const member = await db.query.members.findFirst({
			where: and(
				eq(members.chatId, id.toString()),
				eq(members.userId, userId),
				eq(members.isAdmin, true),
			),
		});

		if (!member) {
			return res.status(403).json({ error: 'Not authorized to delete this chat' });
		}

		await db.delete(chats).where(eq(chats.id, id.toString()));

		res.json({
			message: 'Chat deleted successfully',
		});
	} catch (error) {
		console.error('Delete chat error:', error);
		res.status(500).json({ error: 'Failed to delete chat' });
	}
};
