import { validateEnvs } from './config/env';
import { dbConnect } from './database';

export default function Bootstrap() {
	validateEnvs();
	dbConnect();
}
