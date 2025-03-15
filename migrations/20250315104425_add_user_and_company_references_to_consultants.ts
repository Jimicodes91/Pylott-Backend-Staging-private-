import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('consultants', (table) => {
    // Add the user_id foreign key reference
    table.string('user_id', 36).notNullable().references('id').inTable('users');

    // Add the company_id foreign key reference
    table.string('company_id', 36).notNullable().references('id').inTable('companies');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('consultants', (table) => {
    // Remove the foreign key references
    table.dropForeign('user_id');
    table.dropForeign('company_id');

    // Drop the columns
    table.dropColumn('user_id');
    table.dropColumn('company_id');
  });
}