import { env as loadEnv } from 'custom-env';
import z from 'zod';

process.env.APP_STAGE = process.env.APP_STAGE || 'dev';

const isProduction = process.env.APP_STAGE === 'production';
const isDevelopment = process.env.APP_STAGE === 'dev';
const isTest = process.env.APP_STAGE === 'test';

// Load .env file
if (isDevelopment) {
	loadEnv();
} else if (isTest) {
	loadEnv('test');
}

const envSchema = z.object({
	// NODE ENVIRONMENT
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	APP_STAGE: z.enum(['dev', 'prodution', 'test']).default('dev'),

	// SERVER
	PORT: z.coerce.number().positive().default(5000),

	// DATABSE
	DATABASE_URL: z.string().startsWith('postgresql://'),
	JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
	JWT_EXPIRES_IN: z.string().default('7d'),
	REFRESH_TOKEN_SECRET: z.string().min(32).optional(),
	REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

	// SECURITY
	BCRYPT_ROUNDS: z.coerce.number().min(10).max(20).default(12),

	// CORS
	CORS_ORIGIN: z
		.string()
		.or(z.array(z.string()))
		.transform((val) => {
			if (typeof val === 'string') {
				return val.split(',').map((origin) => origin.trim());
			}
			return val;
		})
		.default([]),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
	env = envSchema.parse(process.env);
} catch (error) {
	if (error instanceof z.ZodError) {
		console.error('❌ Invalid environment variables:');
		console.error(JSON.stringify(error.flatten().fieldErrors, null, 2));

		// More detailed error messages
		error.issues.forEach((err) => {
			const path = err.path.join('.');
			console.error(`  ${path}: ${err.message}`);
		});

		process.exit(1);
	}
	throw error;
}

// Helper functions for environment checks
export const isProd = () => env.NODE_ENV === 'production';
export const isDev = () => env.NODE_ENV === 'development';
export const isTestEnv = () => env.NODE_ENV === 'test';

export default env;
