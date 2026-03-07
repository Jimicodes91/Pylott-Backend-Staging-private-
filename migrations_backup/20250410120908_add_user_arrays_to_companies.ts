// migrations/[timestamp]_add_user_arrays_to_companies.ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    // Add JSON array columns for storing user references
    table.json('client_users');
    table.json('consultant_users');
    
    // If you prefer text arrays (PostgreSQL specific):
    // table.specificType('client_users', 'text[]').defaultTo('{}');
    // table.specificType('consultant_users', 'text[]').defaultTo('{}');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    table.dropColumn('client_users');
    table.dropColumn('consultant_users');
  });
}