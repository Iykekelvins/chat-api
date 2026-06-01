import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.ts';
import { validateBody, validateParams } from '../middleware/validation.ts';
import {
	createChatMessage,
	deleteMessage,
	getChatMessages,
	updateMessage,
} from '../controllers/messageController.ts';
import z from 'zod';

const router = Router();

const createMessageSchema = z.object({
	content: z.string().min(1, { message: 'Content cannot be empty' }),
});

const chatUuidSchema = z.object({
	chatId: z.string().uuid('Invalid chat ID format'),
});

const uuidSchema = z.object({
	id: z.string().uuid('Invalid message ID format'),
});

router.use(authenticateToken);

router.get('/:chatId/messages', validateParams(chatUuidSchema), getChatMessages);
router.post(
	'/:chatId/messages',
	validateParams(chatUuidSchema),
	validateBody(createMessageSchema),
	createChatMessage,
);
router.put(
	'/:chatId/messages/:id',
	validateParams(chatUuidSchema),
	validateParams(uuidSchema),
	updateMessage,
);
router.delete(
	'/:chatId/messages/:id',
	validateParams(chatUuidSchema),
	validateParams(uuidSchema),
	deleteMessage,
);

export default router;
