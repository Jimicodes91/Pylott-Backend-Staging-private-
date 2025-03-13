import 'reflect-metadata';
import { container } from 'tsyringe';

import Application from './app';
import { app } from './config/env';

const applicationInstance = container.resolve(Application);

process.on('SIGINT', () => {
	applicationInstance.close();
	process.exit(1);
});

applicationInstance
	.listen(Number(app.port))
	.then(() => {
		// TODO:: Remove
		console.info(`🚀 Server is listening on port ${app.port} in '${app.env}' mode`);
	})
	.catch((error) => {
		// TODO:: Log
		process.exit(1);
	});
