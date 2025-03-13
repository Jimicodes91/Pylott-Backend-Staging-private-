import type { Knex } from 'knex';

const tableName = 'users';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(tableName, (table) => {
		table.increments('id').primary();
		table.timestamps(true, true);
		table.timestamp('deleted_at').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(tableName);
}
