import type { Knex } from 'knex';

const tableName = 'companies';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Add client_id column
    table.string('client_id', 36).nullable().references('id').inTable('clients').onDelete('SET NULL');

    // Add consultant_id column
    table.string('consultant_id', 36).nullable().references('id').inTable('consultants').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Drop foreign key constraints and columns
    table.dropForeign('client_id');
    table.dropColumn('client_id');

    table.dropForeign('consultant_id');
    table.dropColumn('consultant_id');
  });
}