import { container } from 'tsyringe';

import { app, validateEnvs } from './config/env';
import { dbConnect } from './database';

export default async function Bootstrap() {
  validateEnvs();
  dbConnect();
}
