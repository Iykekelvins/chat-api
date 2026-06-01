import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { comparePassword } from '../utils/password.ts';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema.ts';
import bcrypt from 'bcrypt';
import db from '../db/connection.ts';
import env from '../../env.ts';

export const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
	try {
		const userId = req.user!.id;

		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const { password, ...rest } = user;

		res.json({
			message: 'User fetched successfully',
			data: rest,
		});
	} catch (error) {
		console.error('Fetch user profile error', error);
		res.status(500).json({ error: 'Failed to fetch user profile' });
	}
};

export const updateUserProfile = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	try {
		const userId = req.user!.id;
		const { email, username, firstName, lastName, profilePicture } = req.body;

		const [updatedUser] = await db
			.update(users)
			.set({
				...(email && { email }),
				...(username && { username }),
				...(firstName && { firstName }),
				...(lastName && { lastName }),
				...(profilePicture && { profilePicture }),
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId))
			.returning();

		if (!updatedUser) {
			return res.status(404).json({ error: 'User not found' });
		}

		const { password, ...user } = updatedUser;

		res.json({
			message: 'User updated successfully',
			data: user,
		});
	} catch (error) {
		console.error('Update user profile error', error);
		res.status(500).json({ error: 'Failed to update user profile' });
	}
};

export const updateUserPassword = async (
	req: AuthenticatedRequest,
	res: Response,
) => {
	try {
		const userId = req.user!.id;
		const { password, newPassword, confirmPassword } = req.body;

		const user = await db.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		const isPasswordValid = await comparePassword(password, user!.password);
		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Invalid credentials' });
		}

		if (newPassword !== confirmPassword) {
			return res.status(400).json({ error: 'Passwords do not match' });
		}

		const saltRounds = parseInt((env.BCRYPT_ROUNDS as unknown as string) || '12');
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		await db
			.update(users)
			.set({
				password: hashedPassword,
			})
			.where(eq(users.id, userId));

		res.json({
			message: 'Password updated successfully',
		});
	} catch (error) {
		console.error('Update user password error', error);
		res.status(500).json({ error: 'Failed to update user password' });
	}
};
