import { Knex } from 'knex';

import { database } from './src/config/env';

const { knex } = database;

const config = knex as Knex.Config;

export default config;
