import { createTestUser, cleanupDatabase } from './helpers/dbHelpers.ts';

describe('Test Setup Verification', () => {
	test('should connect to test database', async () => {
		const { user, token } = await createTestUser();

		expect(user).toBeDefined();
		expect(user.email).toContain('@example.com');
		expect(token).toBeDefined();

		await cleanupDatabase();
	});
});
