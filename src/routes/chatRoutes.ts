import { Router } from 'express';
import {
	createChat,
	deleteChat,
	getChatById,
	getChats,
} from '../controllers/chatController.ts';
import { validateBody, validateParams } from '../middleware/validation.ts';
import { authenticateToken } from '../middleware/auth.ts';
import z from 'zod';

const router = Router();

const createChatSchema = z.object({
	name: z.string().optional(),
	memberIds: z.array(z.string().uuid(), { message: 'Member Ids is required' }),
});

const uuidSchema = z.object({
	id: z.string().uuid('Invalid chat ID format'),
});

router.use(authenticateToken);

router.get('/', getChats);
router.post('/', validateBody(createChatSchema), createChat);
router.get('/:id', validateParams(uuidSchema), getChatById);
router.delete('/:id', validateParams(uuidSchema), deleteChat);

export default router;
