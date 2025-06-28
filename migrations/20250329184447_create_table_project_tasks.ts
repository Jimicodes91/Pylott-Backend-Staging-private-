import type { Knex } from 'knex';

const tableName = 'project_tasks';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.string('id').primary();
		table.string('project_id').notNullable().index();
		table.string('assignee_id').nullable().index();
		table.string('author_id').notNullable().index();
		table.string('company_id').notNullable().index();
		table.string('name');
		table.string('description');
		table.string('status');
		table.timestamp('start_date');
		table.timestamp('end_date');
		table.boolean("is_visible_to_client");
		table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(tableName);
}
