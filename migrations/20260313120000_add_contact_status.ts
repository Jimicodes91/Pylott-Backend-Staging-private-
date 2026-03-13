import type { Knex } from 'knex';

const tableName = 'contacts';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.string('status', 50).defaultTo('Uninvited').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn('status');
  });
}
