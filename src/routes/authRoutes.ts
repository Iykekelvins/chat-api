import { Router } from 'express';
import { login, register } from '../controllers/authController.ts';
import { validateBody } from '../middleware/validation.ts';
import z from 'zod';

const router = Router();

const registerSchema = z.object({
	email: z.string().email('Invalid email format'),
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(50, 'Username too long'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	firstName: z.string().optional(),
	lastName: z.string().optional(),
});

const loginSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
});

router.post('/register', validateBody(registerSchema), register);

router.post('/login', validateBody(loginSchema), login);

router.post('/logout', (req, res) => {
	res.status(201).json({ message: 'Logout successful' });
});

export default router;
