import type { Knex } from 'knex';

const tableName = 'project_tasks';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTableIfNotExists(tableName, (table) => {
		table.string('id').unique().notNullable();
		table.string('project_id').notNullable().index();
		table.string('assignee_id').notNullable().index();
		table.string('author_id').notNullable().index();
		table.string('name');
		table.string('description');
		table.string('status');
		table.timestamp('start_date');
		table.timestamp('end_date');
		table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists(tableName);
}
