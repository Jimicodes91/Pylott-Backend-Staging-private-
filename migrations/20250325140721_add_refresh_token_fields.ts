// migrations/YYYYMMDDHHMMSS_add_refresh_token_fields.ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.string('refresh_token').nullable();
    table.string('refresh_token_expires').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('refresh_token');
    table.dropColumn('refresh_token_expires');
  });
}