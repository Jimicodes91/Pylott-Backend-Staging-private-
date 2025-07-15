import type { Knex } from 'knex';

const tableName = 'project_settings';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableName, (table) => {
		table.boolean('client_can_view_event').defaultTo(false);
		table.boolean('client_can_view_project_members').defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableName, table => {
    table.dropColumn('client_can_view_event');
    table.dropColumn('client_can_view_project_members');
  });
}
