import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.ts';
import {
	getUserByUsername,
	getUserProfile,
	updateUserPassword,
	updateUserProfile,
} from '../controllers/userController.ts';
import { validateBody, validateParams } from '../middleware/validation.ts';
import z from 'zod';

const router = Router();

const updateProfileSchema = z.object({
	email: z.string().email().optional(),
	username: z.string().optional(),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	profilePicture: z.string().optional(),
});

const updatePasswordSchema = z
	.object({
		password: z.string().min(8, 'Password must be at least 8 characters'),
		newPassword: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword'],
	});

const searchUserSchema = z.object({
	username: z.string().min(1, { message: 'Username cannot be empty' }),
});

router.use(authenticateToken);

router.get('/profile', getUserProfile);
router.put('/profile', validateBody(updateProfileSchema), updateUserProfile);
router.put(
	'/profile/password',
	validateBody(updatePasswordSchema),
	updateUserPassword,
);
router.get('/search/:username', validateParams(searchUserSchema), getUserByUsername);

export default router;
