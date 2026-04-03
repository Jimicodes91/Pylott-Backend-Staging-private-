import 'reflect-metadata';
import { container } from 'tsyringe';
import knex from 'knex';

import Application from './app';
import { app, database } from './config/env';

const applicationInstance = container.resolve(Application);

process.on('SIGINT', () => {
  applicationInstance.close();
  process.exit(1);
});

// Run pending migrations before starting the server
const db = knex(database.knex as any);
db.migrate
  .latest()
  .then(([batchNo, log]) => {
    if (log.length > 0) {
      console.info(`✅ Ran ${log.length} migration(s) in batch ${batchNo}:`);
      log.forEach((m: string) => console.info(`   - ${m}`));
    } else {
      console.info('✅ Migrations already up to date');
    }
    return db.destroy();
  })
  .then(() => {
    return applicationInstance.listen(Number(app.port));
  })
  .then(() => {
    console.info(`🚀 Server is listening on port ${app.port} in '${app.env}' mode`);
  })
  .catch((error) => {
    console.error('Error during startup:', error);
    process.exit(1);
  });
