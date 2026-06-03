import { config } from 'dotenv';
config({ path: '.env.test' });

import { db } from '../../src/db/connection.ts';
import { users, chats, messages, members } from '../../src/db/schema.ts';
import { hashPassword } from '../../src/utils/password.ts';
import { generateToken } from '../../src/utils/jwt.ts';

export async function createTestUser(
	userData: Partial<{
		email: string;
		username: string;
		password: string;
		firstName: string;
		lastName: string;
	}> = {},
) {
	const defaultData = {
		email: `test-${Date.now()}-${Math.random()}@example.com`,
		username: `testuser-${Date.now()}-${Math.random()}`,
		password: 'TestPassword123!',
		firstName: 'Test',
		lastName: 'User',
		...userData,
	};

	const hashedPassword = await hashPassword(defaultData.password);
	const [user] = await db
		.insert(users)
		.values({
			...defaultData,
			password: hashedPassword,
		})
		.returning();

	const token = await generateToken({
		id: user.id,
		email: user.email,
		username: user.username,
	});

	return { user, token, rawPassword: defaultData.password };
}

export async function createTestChat(
	memberId: string,
	chatData: Partial<{
		name: string;
		isGroup?: boolean;
		memberIds: string[];
	}> = {},
) {
	const defaultData = {
		name: `Test Chat ${Date.now()}`,
		isGroup: false,
		memberIds: [memberId],
		...chatData,
	};

	const [chat] = await db
		.insert(chats)
		.values({
			...defaultData,
		})
		.returning();

	return chat;
}

export async function cleanupDatabase() {
	// Clean up in the right order due to foreign key constraints
	await db.delete(members);
	await db.delete(messages);
	await db.delete(chats);
	await db.delete(users);
}
