import Knex from 'knex';
import knexConfig from '../../knexfile';

let knexInstance: Knex.Knex | null = null;

// Lazy initialization to avoid circular dependencies
export function getKnex(): Knex.Knex {
  if (!knexInstance) {
    knexInstance = Knex(knexConfig);
  }
  return knexInstance;
}

export default getKnex;
