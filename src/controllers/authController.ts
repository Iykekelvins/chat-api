import type { Request, Response } from 'express';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { comparePassword } from '../utils/password.ts';
import { generateToken } from '../utils/jwt.ts';

import db from '../db/connection.ts';
import bcrypt from 'bcrypt';
import env from '../../env.ts';

export const register = async (req: Request, res: Response) => {
	try {
		const { email, password, firstName, lastName, username } = req.body;

		// Hash password with salt rounds
		const saltRounds = parseInt((env.BCRYPT_ROUNDS as unknown as string) || '12');
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create and add user to database
		const [newUser] = await db
			.insert(users)
			.values({
				email,
				password: hashedPassword,
				firstName,
				lastName,
				username,
			})
			.returning({
				id: users.id,
				email: users.email,
				username: users.username,
				firstName: users.firstName,
				lastName: users.lastName,
				createdAt: users.createdAt,
			});

		// Generate token for user login
		const token = await generateToken({
			id: newUser.id,
			email: newUser.email,
			username: newUser.username,
		});

		res.status(201).json({
			message: 'User created successfully',
			user: newUser,
			token,
		});
	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({
			error: 'Failed to create user',
		});
	}
};

export const login = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;

		// Check if user exists with email
		const [user] = await db.select().from(users).where(eq(users.email, email));
		if (!user) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		// Verify user password
		const isPasswordValid = await comparePassword(password, user.password);
		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		// Generate token for user login
		const token = await generateToken({
			id: user.id,
			email: user.email,
			username: user.username,
		});

		res.json({
			message: 'Login successful',
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				firstName: user.firstName,
				lastName: user.lastName,
			},
			token,
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'Failed to login' });
	}
};
