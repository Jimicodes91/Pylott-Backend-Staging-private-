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
    console.info(`🚀 Server is listening on port ${app.port} in '${app.env}' mode`);
  })
  .catch((error) => {
    console.error('Error starting server:', error);
    process.exit(1);
  });
