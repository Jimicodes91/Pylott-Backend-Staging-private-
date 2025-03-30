import type { Knex } from 'knex';

const tableName = 'events';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.string('id').primary();
		table.string('company_id').notNullable().index();
		table.string('project_id').notNullable().index();
		table.string('event_type_id').notNullable();
		table.string('created_by').notNullable();
		table.string('name').notNullable();
		table.datetime('start_datetime').notNullable();
		table.datetime('end_datetime').notNullable();
		table.text('description');
		table.string('venue');
		table.string('provider_identifier');
		table.boolean('is_visible_to_client').defaultTo(false);
		table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists(tableName);
}
