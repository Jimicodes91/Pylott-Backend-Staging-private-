import type { Knex } from 'knex';

const tableName = 'project_tasks';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(tableName, (table) => {
		table.string(' task_type_id').nullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {}
