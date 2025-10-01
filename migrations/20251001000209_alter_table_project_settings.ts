import type { Knex } from 'knex';

const tableName = 'project_settings';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableName, (table) => {
		table.dropColumn('project_id')
	});
}

export async function down(knex: Knex): Promise<void> {
}
