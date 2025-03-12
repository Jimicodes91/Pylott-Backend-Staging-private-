import 'dotenv/config';
import * as process from 'process';

import { requiredBootTimeEnvs } from '@/shared/constants/env.constants';

export const app = {
	url: process.env.BASE_PATH || '',
	port: process.env.PORT || 5000,
	env: process.env.NODE_ENV || 'development',
	name: process.env.APP_NAME || 'Pylott',
	email: process.env.APP_EMAIL || '',
};

export const database = {
	knex: {
		client: process.env.DB_CLIENT || 'mysql2',
		database: process.env.DB_DATABASE,
		user: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		port: process.env.DB_PORT,
		charset: 'utf8mb4',
		pool: {
			min: 2,
			max: 10,
		},
		migrations: {
			tableName: 'knex_migrations',
			directory: './migrations',
			extension: 'ts',
		},
		debug: false,
	},
};

export const mail = {
	smtp: {
		user: process.env.SMTP_USERNAME,
		pass: process.env.SMTP_PASSWORD,
		port: Number(process.env.SMTP_PORT),
		host: process.env.SMTP_HOST,
		secure: false,
		sender: process.env.SMTP_SENDER,
	},
};

export const storage = {
	cloudinary: {
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
		api_key: process.env.CLOUDINARY_API_KEY,
		api_secret: process.env.CLOUDINARY_API_SECRET,
	},
};

/**
 * Configures the environment variables for the application and throws an error if
 * any required environment variables are missing.
 */
export const validateEnvs = () => {
	const missingRequiredEnvsHandler = (accNullEnvs, currEnv) => {
		const currEnvSet = process.env[currEnv.toUpperCase()];
		return currEnvSet ? accNullEnvs : [...accNullEnvs, currEnv.toUpperCase()];
	};

	const nullEnvKeys = requiredBootTimeEnvs.reduce(missingRequiredEnvsHandler, []);

	const concatenatedMissingEnvs = nullEnvKeys.join(', ');

	const errMsg = `The following required env variable(s) are missing: ${concatenatedMissingEnvs}`;

	if (nullEnvKeys.length) throw new Error(errMsg);
};
