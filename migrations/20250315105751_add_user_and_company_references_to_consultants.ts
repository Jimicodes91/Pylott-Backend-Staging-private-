import type { Knex } from 'knex';

const tableName = 'consultants';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Add user_id foreign key
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');

    // Add company_id foreign key
    table.string('company_id', 36).notNullable().references('id').inTable('companies').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    // Drop foreign key constraints and columns
    table.dropForeign('user_id');
    table.dropColumn('user_id');

    table.dropForeign('company_id');
    table.dropColumn('company_id');
  });
}