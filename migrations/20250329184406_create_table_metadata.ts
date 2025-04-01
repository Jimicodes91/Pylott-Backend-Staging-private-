import type { Knex } from 'knex';

const tableName = 'metadata';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.string('id').primary();
		table.string('company_id').notNullable().index();
		table.string('project_id').nullable().index();
		table.string('type').notNullable().index();
		table.string('name');
		table.text('description');
		table.boolean('is_system').defaultTo(false).notNullable();
		table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable(tableName);
}
