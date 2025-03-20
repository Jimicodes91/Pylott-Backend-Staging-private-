// migrations/20231010123456_add_foreign_keys.ts
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add foreign key for companies.admin_id -> users.id
  await knex.schema.alterTable('companies', (table) => {
    table.foreign('admin_id').references('id').inTable('users');
  });

  // Add foreign key for clients.company_id -> companies.id
  await knex.schema.alterTable('clients', (table) => {
    table.foreign('company_id').references('id').inTable('companies');
  });

  // Add foreign key for consultants.user_id -> users.id
  await knex.schema.alterTable('consultants', (table) => {
    table.foreign('user_id').references('id').inTable('users');
  });

  // Add foreign key for consultants.company_id -> companies.id
  await knex.schema.alterTable('consultants', (table) => {
    table.foreign('company_id').references('id').inTable('companies');
  });
}

export async function down(knex: Knex): Promise<void> {
  // Drop foreign keys
  await knex.schema.alterTable('companies', (table) => {
    table.dropForeign('admin_id');
  });

  await knex.schema.alterTable('clients', (table) => {
    table.dropForeign('company_id');
  });

  await knex.schema.alterTable('consultants', (table) => {
    table.dropForeign('user_id');
    table.dropForeign('company_id');
  });
}