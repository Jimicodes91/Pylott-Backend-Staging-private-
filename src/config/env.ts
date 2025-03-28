import 'dotenv/config';
import * as process from 'process';

import { requiredBootTimeEnvs } from '../shared/constants/env.constants';

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
    connection: {
      database: process.env.DB_DATABASE,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
      host: process.env.DB_HOST,
      charset: 'utf8mb4',
    },
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
  nodemailer: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASSWORD,
    mail: process.env.NODEMAILER_MAIL,
    host: process.env.NODEMAILER_HOST,
    secure: false,
    port: process.env.NODEMAILER_PORT,
  },
};

export const JWT_SECRET_KEY = process.env.JWT_SECRET;

export const storage = {
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
};

// export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173' || "https://silly-choux-da3934.netlify.app/";
const urlConfig = {
  development: {
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  production: {
    FRONTEND_URL: 'https://silly-choux-da3934.netlify.app',
  },
};

export const FRONTEND_URL = urlConfig[process.env.NODE_ENV || 'development'].FRONTEND_URL;
console.log(FRONTEND_URL);

export const TOKEN_EXPIRATION_MS = Date.now() + 900000;
export const PASSWORD_RESET_TOKEN_LENGTH = 15;
export const TEMP_PASSWORD_LENGTH = 8;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '653485325620-j99cl2a2c48054rr4725ot7ub9j8mb85.apps.g';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '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';

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
