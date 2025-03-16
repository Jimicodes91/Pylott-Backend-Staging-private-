import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    // Add subscription_status column
    table.string('subscription_status').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('companies', (table) => {
    // Drop subscription_status column
    table.dropColumn('subscription_status');
  });
}