import express from 'express';
import env, { isTestEnv } from '../env.ts';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.ts';
import chatRoutes from './routes/chatRoutes.ts';
import messageRoutes from './routes/messageRoutes.ts';
import userRoutes from './routes/userRoutes.ts';

const app = express();
app.use(helmet());
app.use(
	cors({
		origin: env.CORS_ORIGIN,
		credentials: true,
	}),
);
app.use(express.json());
app.use(
	morgan('dev', {
		skip: () => isTestEnv(),
	}),
);

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/chats', messageRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'OK',
		timestamp: new Date().toISOString(),
		service: 'Chat API',
	});
});

export default app;
