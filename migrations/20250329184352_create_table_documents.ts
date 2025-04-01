import type { Knex } from 'knex';

const tableName = 'documents';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.string('id').primary();
		table.string('company_id').notNullable().index();
		table.string('project_id').nullable().index();
		table.string('document_type_id').nullable().index();
		table.string('task_id').nullable().index();
		table.string('note_id').nullable().index();
		table.string('name').notNullable().index();
		table.string('type').notNullable();
		table.text('description').nullable();
		table.boolean('is_visible_to_client').defaultTo(false).notNullable();
		table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(tableName);
}
