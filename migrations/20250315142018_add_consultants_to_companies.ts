import type { Knex } from 'knex';

const tableName = 'companies';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.specificType('consultants', 'text[]').nullable(); // Use 'uuid[]' if storing UUIDs
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn('consultants');
  });
}