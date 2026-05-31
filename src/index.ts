import env from '../env.ts';
import app from './server.ts';

// START THE SERVER
app.listen(env.PORT, () => {
	console.log(`Server is running on port ${env.PORT}`);
	console.log(`Environment: ${env.APP_STAGE}`);
});
