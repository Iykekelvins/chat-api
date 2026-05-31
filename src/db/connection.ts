import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import env from '../../env.ts';
import * as schema from './schema.ts';

const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
export default db;
